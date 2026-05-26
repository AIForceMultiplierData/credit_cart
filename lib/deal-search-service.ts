import * as cheerio from "cheerio"
import { call_ai, safeJsonExtract } from "@/lib/llm-router"
import {
  applySerperOverrides,
  sortOffersStrict,
} from "@/lib/deal-search-ranking"
import {
  buildFallbackResult,
  DEAL_SEARCH_SYSTEM_PROMPT,
  detectPlatform,
  normalizeCategory,
  type DealOffer,
  type DealSearchCategory,
  type DealSearchResult,
  type MarketOffer,
  type TravelListing,
  type SearchCardInput,
  type WalletCardInput,
} from "@/lib/deal-search"
import { buildMissingCardTeasers } from "@/lib/deal-search-missing-cards"
import { enrichDealSearchResult } from "@/lib/deal-offer-breakdown"
import {
  buildFlightProductTitle,
  buildFlightReferenceUrl,
  buildFlightSerperQuery,
  parseFlightSearchBody,
  validateFlightSearch,
  type FlightSearchParams,
} from "@/lib/flight-search"
import {
  buildHotelProductTitle,
  buildHotelReferenceUrl,
  buildHotelSerperQuery,
  parseHotelSearchBody,
  validateHotelSearch,
  type HotelSearchParams,
} from "@/lib/hotel-search"
import {
  fetchProductListings,
  resolveProductListing,
} from "@/lib/product-listings"
import {
  buildProductProductTitle,
  buildProductReferenceUrl,
  buildProductSerperQuery,
  parseProductSearchBody,
  validateProductSearch,
  type ProductSearchParams,
} from "@/lib/product-search"
import {
  generateFlightListings,
  generateHotelListings,
  resolveTravelPrice,
} from "@/lib/travel-listings"
import {
  fetchSerperDealContext,
  type SerperDealContext,
} from "@/lib/serper-client"

type SearchRequestBody = {
  category?: string
  url?: string
  searchCards?: SearchCardInput[]
  walletCards?: WalletCardInput[]
  flightSearch?: unknown
  hotelSearch?: unknown
  productSearch?: unknown
}

export type DealSearchOverrides = {
  productTitle?: string
  estimatedPrice?: number | null
  serperQuery?: string
  travelListings?: TravelListing[]
  selectedTravelListingId?: string | null
  platform?: string
}

function buildTravelOverrides(
  category: DealSearchCategory,
  flight: FlightSearchParams | null,
  hotel: HotelSearchParams | null
): DealSearchOverrides | { error: string } {
  if (category === "flight" && flight) {
    const listings = generateFlightListings(flight)
    const price = resolveTravelPrice(
      listings,
      flight.estimatedFare,
      flight.selectedListingId
    )
    if (price === null) {
      return { error: "Pick a flight or enter total fare (₹) for card ranking." }
    }
    return {
      productTitle: buildFlightProductTitle(flight),
      estimatedPrice: price,
      serperQuery: buildFlightSerperQuery(flight),
      travelListings: listings,
      selectedTravelListingId:
        flight.selectedListingId ?? listings[0]?.id ?? null,
    }
  }

  if (category === "hotels" && hotel) {
    const listings = generateHotelListings(hotel)
    const price = resolveTravelPrice(
      listings,
      hotel.estimatedTotal,
      hotel.selectedListingId
    )
    if (price === null) {
      return {
        error: "Pick a hotel or enter total stay price (₹) for card ranking.",
      }
    }
    return {
      productTitle: buildHotelProductTitle(hotel),
      estimatedPrice: price,
      serperQuery: buildHotelSerperQuery(hotel),
      travelListings: listings,
      selectedTravelListingId:
        hotel.selectedListingId ?? listings[0]?.id ?? null,
    }
  }

  return { error: "Invalid travel search." }
}

export async function buildProductOverrides(
  product: ProductSearchParams
): Promise<DealSearchOverrides & { url: string } | { error: string }> {
  const listings = await fetchProductListings(product)
  if (listings.length === 0) {
    return {
      error:
        "No store listings found. Try a shorter product name or paste a link.",
    }
  }

  const { listing, price: resolvedPrice } = resolveProductListing(
    listings,
    product.estimatedPrice,
    product.selectedListingId,
    product.query
  )

  let price = resolvedPrice
  if (price === null || price <= 0) {
    if (product.estimatedPrice && product.estimatedPrice > 0) {
      price = product.estimatedPrice
    } else {
      const priced = listings.find((l) => l.price > 0)
      price = priced?.price ?? null
    }
  }

  if (price === null || price <= 0) {
    return {
      error:
        "Pick a store listing below or enter total price (₹) for card ranking.",
    }
  }

  const selected =
    listing ??
    listings.find((l) => l.id === product.selectedListingId) ??
    listings[0]

  const url =
    selected?.product_url?.trim() ||
    product.pastedUrl?.trim() ||
    buildProductReferenceUrl(product)

  return {
    productTitle: buildProductProductTitle(product),
    estimatedPrice: price,
    serperQuery: buildProductSerperQuery(product),
    travelListings: listings,
    selectedTravelListingId: selected?.id ?? listings[0]?.id ?? null,
    platform: selected?.provider ?? detectPlatform(url),
    url,
  }
}

function applyTravelToResult(
  result: DealSearchResult,
  overrides?: DealSearchOverrides
): DealSearchResult {
  if (!overrides?.travelListings?.length) {
    return {
      ...result,
      travel_listings: result.travel_listings ?? [],
      selected_travel_listing_id: result.selected_travel_listing_id ?? null,
    }
  }

  const tag =
    overrides?.travelListings?.[0]?.category === "product"
      ? "store_compare"
      : "travel_estimates"
  const sources = result.data_sources.includes(tag)
    ? result.data_sources
    : [...result.data_sources, tag]

  return {
    ...result,
    travel_listings: overrides.travelListings,
    selected_travel_listing_id: overrides.selectedTravelListingId ?? null,
    estimated_price: overrides.estimatedPrice ?? result.estimated_price,
    data_sources: sources,
  }
}

type UrlHints = {
  title?: string
  price?: number | null
}

type AiDealPayload = {
  product_title?: string
  platform?: string
  estimated_price?: number | null
  offers?: Array<Partial<DealOffer> & { card_id: string }>
  summary?: string
}

function cardKey(card: { card_id: string; owner_user_id?: string }): string {
  return `${card.card_id}:${card.owner_user_id ?? "self"}`
}

function countSearchCards(searchCards: SearchCardInput[]) {
  return {
    wallet_card_count: searchCards.filter((c) => c.source === "wallet").length,
    circle_card_count: searchCards.filter((c) => c.source === "circle").length,
  }
}

function toSearchCards(
  walletCards: WalletCardInput[],
  searchCards?: SearchCardInput[]
): SearchCardInput[] {
  if (Array.isArray(searchCards) && searchCards.length > 0) {
    return searchCards.map((card) => ({
      card_id: card.card_id,
      bank_name: card.bank_name,
      card_name: card.card_name,
      source: card.source === "circle" ? "circle" : "wallet",
      owner_user_id: card.owner_user_id,
      owner_name: card.owner_name,
    }))
  }

  return walletCards.map((card) => ({
    ...card,
    source: "wallet" as const,
    owner_name: "You",
  }))
}

function buildMarketOffersFromSerper(serper: SerperDealContext): MarketOffer[] {
  const fromOrganic = serper.card_offer_snippets.map((row) => ({
    title: row.title,
    snippet: row.snippet,
    source: "Live web offer",
    url: row.link,
  }))

  const fromShopping = serper.shopping_results.map((row) => ({
    title: row.title,
    snippet: row.price ? `Listed at ${row.price}` : "Shopping listing",
    source: row.source || "Shopping",
    url: row.link,
  }))

  return [...fromOrganic, ...fromShopping].slice(0, 8)
}

function buildDataSources(
  hints: UrlHints,
  serper: SerperDealContext,
  usedAi: boolean
): string[] {
  const sources: string[] = []

  if (hints.title || hints.price != null) {
    sources.push("url_scrape")
  }
  if (serper.used_serper) {
    sources.push("serper")
  }
  if (usedAi) {
    sources.push("ai")
  }
  if (sources.length === 0) {
    sources.push("rules")
  }

  return sources
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d.]/g, "")
  const parsed = Number(digits)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

async function fetchUrlHints(url: string): Promise<UrlHints> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoolPayBot/1.0; +https://poolpay.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return {}
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      $("title").first().text().trim()

    const priceRaw =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[itemprop="price"]').attr("content") ||
      $('[data-a-price-amount]').first().attr("data-a-price-amount") ||
      $(".a-price-whole").first().text()

    return {
      title: title || undefined,
      price: parsePrice(typeof priceRaw === "string" ? priceRaw : undefined),
    }
  } catch {
    return {}
  }
}

function normalizeOffers(
  aiOffers: AiDealPayload["offers"],
  searchCards: SearchCardInput[],
  estimatedPrice: number | null,
  category: DealSearchCategory,
  url: string,
  serper: SerperDealContext,
  platform: string
): DealOffer[] {
  const aiByKey = new Map<string, Partial<DealOffer> & { card_id: string }>()

  for (const offer of aiOffers ?? []) {
    if (!offer?.card_id) continue
    aiByKey.set(cardKey(offer), offer)
    if (!aiByKey.has(`${offer.card_id}:self`)) {
      aiByKey.set(`${offer.card_id}:self`, offer)
    }
  }

  const fallbackOffers = buildFallbackResult(
    category,
    url,
    searchCards,
    estimatedPrice
  ).offers
  const fallbackByKey = new Map(
    fallbackOffers.map((offer) => [cardKey(offer), offer])
  )

  const merged = searchCards.map((card) => {
    const key = cardKey(card)
    const ai = aiByKey.get(key) ?? aiByKey.get(`${card.card_id}:self`)
    const fallback = fallbackByKey.get(key)

    const discountPercent =
      Number(ai?.discount_percent) || fallback?.discount_percent || 2
    const discountAmount =
      estimatedPrice !== null
        ? Math.round((estimatedPrice * discountPercent) / 100)
        : Number(ai?.discount_amount) || fallback?.discount_amount || 0

    const base: DealOffer = {
      card_id: card.card_id,
      bank_name: card.bank_name,
      card_name: card.card_name,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      estimated_final_price:
        estimatedPrice !== null
          ? Math.max(estimatedPrice - discountAmount, 0)
          : ai?.estimated_final_price ?? fallback?.estimated_final_price ?? null,
      reason:
        ai?.reason ||
        fallback?.reason ||
        (card.source === "circle"
          ? `${card.owner_name ?? "Circle"}'s ${card.bank_name} ${card.card_name}`
          : `${card.bank_name} ${card.card_name} wallet offer`),
      recommended: false,
      source: card.source,
      owner_user_id: card.owner_user_id,
      owner_name: card.owner_name,
      serper_backed: false,
      terms_and_conditions: Array.isArray(ai?.terms_and_conditions)
        ? ai.terms_and_conditions.filter((t): t is string => typeof t === "string")
        : undefined,
    }

    return applySerperOverrides(base, card, serper, estimatedPrice, platform)
  })

  if (merged.length === 0) {
    return fallbackOffers
  }

  return sortOffersStrict(merged, estimatedPrice)
}

function attachSerperMetadata(
  result: DealSearchResult,
  hints: UrlHints,
  serper: SerperDealContext,
  usedAi: boolean,
  searchCards: SearchCardInput[],
  sourceUrl: string
): DealSearchResult {
  const counts = countSearchCards(searchCards)
  const estimatedPrice =
    result.estimated_price ?? serper.price ?? hints.price ?? null

  return {
    ...result,
    ...counts,
    product_title:
      result.product_title ||
      serper.product_title ||
      hints.title ||
      "Linked purchase",
    estimated_price: estimatedPrice,
    used_serper: serper.used_serper,
    data_sources: buildDataSources(hints, serper, usedAi),
    market_offers: buildMarketOffersFromSerper(serper),
    missing_card_teasers: buildMissingCardTeasers({
      url: sourceUrl,
      estimatedPrice,
      searchCards,
      offers: result.offers,
      serper,
    }),
  }
}

function buildAiResult(
  category: DealSearchCategory,
  url: string,
  searchCards: SearchCardInput[],
  aiPayload: AiDealPayload,
  hints: UrlHints,
  serper: SerperDealContext,
  overrides?: DealSearchOverrides
): DealSearchResult {
  const estimatedPrice =
    aiPayload.estimated_price ?? serper.price ?? hints.price ?? null
  const offers = normalizeOffers(
    aiPayload.offers,
    searchCards,
    estimatedPrice,
    category,
    url,
    serper,
    overrides?.platform ?? detectPlatform(url)
  )
  const bestOffer = offers.find((offer) => offer.recommended) ?? offers[0] ?? null
  const counts = countSearchCards(searchCards)

  const ownerLabel =
    bestOffer?.source === "circle" && bestOffer.owner_name
      ? `${bestOffer.owner_name}'s `
      : ""

  const base: DealSearchResult = {
    product_title:
      aiPayload.product_title ||
      serper.product_title ||
      hints.title ||
      "Linked purchase",
    platform:
      overrides?.platform || aiPayload.platform || detectPlatform(url),
    category,
    source_url: url,
    estimated_price: estimatedPrice,
    best_offer: bestOffer,
    offers,
    summary:
      aiPayload.summary ||
      (bestOffer
        ? `Best pick: ${ownerLabel}${bestOffer.bank_name} ${bestOffer.card_name} saves ~₹${bestOffer.discount_amount.toLocaleString("en-IN")}.`
        : "No cards to compare."),
    used_ai: true,
    used_serper: serper.used_serper,
    data_sources: buildDataSources(hints, serper, true),
    travel_listings: [],
    selected_travel_listing_id: null,
    market_offers: buildMarketOffersFromSerper(serper),
    ...counts,
  }

  return finalizeSearchResult(
    attachSerperMetadata(base, hints, serper, true, searchCards, url),
    url,
    overrides
  )
}

function finalizeSearchResult(
  result: DealSearchResult,
  url: string,
  overrides?: DealSearchOverrides
): DealSearchResult {
  return applyTravelToResult(enrichDealSearchResult(result, url), overrides)
}

export async function searchDealsForWallet(
  category: DealSearchCategory,
  url: string,
  searchCards: SearchCardInput[],
  overrides?: DealSearchOverrides
): Promise<DealSearchResult> {
  const platform = overrides?.platform ?? detectPlatform(url)
  const hints = await fetchUrlHints(url)

  const serper = await fetchSerperDealContext({
    url,
    platform,
    category,
    walletCards: searchCards,
    existingTitle: overrides?.productTitle ?? hints.title,
    existingPrice: overrides?.estimatedPrice ?? hints.price ?? null,
    serperQuery: overrides?.serperQuery,
  })

  const enrichedHints: UrlHints = {
    title: overrides?.productTitle ?? hints.title ?? serper.product_title,
    price: overrides?.estimatedPrice ?? hints.price ?? serper.price ?? null,
  }

  try {
    const aiRaw = await call_ai(DEAL_SEARCH_SYSTEM_PROMPT, {
      category,
      url,
      platform,
      pageHints: enrichedHints,
      searchCards,
      serperFindings: {
        product_snippets: serper.product_snippets,
        card_offer_snippets: serper.card_offer_snippets,
        shopping_results: serper.shopping_results,
        queries_run: serper.queries_run,
      },
    })

    const aiPayload =
      typeof aiRaw === "object" && aiRaw !== null
        ? (aiRaw as AiDealPayload)
        : (safeJsonExtract(String(aiRaw)) as AiDealPayload)

    return buildAiResult(
      category,
      url,
      searchCards,
      aiPayload,
      enrichedHints,
      serper,
      overrides
    )
  } catch {
    const fallback = buildFallbackResult(
      category,
      url,
      searchCards,
      enrichedHints.price ?? null
    )

    if (enrichedHints.title) {
      fallback.product_title = enrichedHints.title
    }

    const offers = normalizeOffers(
      undefined,
      searchCards,
      fallback.estimated_price,
      category,
      url,
      serper,
      platform
    )
    fallback.offers = offers
    fallback.best_offer = offers.find((o) => o.recommended) ?? offers[0] ?? null
    fallback.platform = platform

    return finalizeSearchResult(
      attachSerperMetadata(
        fallback,
        enrichedHints,
        serper,
        false,
        searchCards,
        url
      ),
      url,
      overrides
    )
  }
}

export async function parseSearchRequestBody(body: SearchRequestBody): Promise<
  | {
      category: DealSearchCategory
      url: string
      searchCards: SearchCardInput[]
      overrides?: DealSearchOverrides
    }
  | { error: string }
> {
  const category = normalizeCategory(String(body.category ?? ""))

  if (!category) {
    return { error: "Select a category: flight, hotels, or product." }
  }

  let url = String(body.url ?? "").trim()
  let overrides: DealSearchOverrides | undefined

  if (category === "flight") {
    if (!body.flightSearch) {
      return {
        error:
          "Complete flight route, dates, and fare — required for card ranking.",
      }
    }
    const flight = parseFlightSearchBody(body.flightSearch)
    if (!flight) {
      return { error: "Invalid flight search details." }
    }
    const valid = validateFlightSearch(flight, { requirePrice: false })
    if (!valid.ok) {
      return { error: valid.message }
    }
    url = buildFlightReferenceUrl(flight)
    const travel = buildTravelOverrides("flight", flight, null)
    if ("error" in travel) return { error: travel.error }
    overrides = travel
  }

  if (category === "hotels") {
    if (!body.hotelSearch) {
      return {
        error:
          "Complete hotel city, dates, and price — required for card ranking.",
      }
    }
    const hotel = parseHotelSearchBody(body.hotelSearch)
    if (!hotel) {
      return { error: "Invalid hotel search details." }
    }
    const valid = validateHotelSearch(hotel, { requirePrice: false })
    if (!valid.ok) {
      return { error: valid.message }
    }
    url = buildHotelReferenceUrl(hotel)
    const travel = buildTravelOverrides("hotels", null, hotel)
    if ("error" in travel) return { error: travel.error }
    overrides = travel
  }

  if (category === "product") {
    if (!body.productSearch) {
      return {
        error: "Describe what you want to buy to compare stores and cards.",
      }
    }
    const product = parseProductSearchBody(body.productSearch)
    if (!product) {
      return { error: "Invalid product search details." }
    }
    const valid = validateProductSearch(product, { requirePrice: false })
    if (!valid.ok) {
      return { error: valid.message }
    }
    const built = await buildProductOverrides(product)
    if ("error" in built) {
      return { error: built.error }
    }
    url = built.url
    overrides = built
  }

  if (!url) {
    return {
      error:
        "Describe a product, or complete flight / hotel search details.",
    }
  }

  if (!isValidHttpUrl(url)) {
    return { error: "Enter a valid http or https URL." }
  }

  const rawWallet = Array.isArray(body.walletCards) ? body.walletCards : []
  const rawSearch = Array.isArray(body.searchCards) ? body.searchCards : []

  const searchCards = toSearchCards(
    rawWallet.filter(
      (card) =>
        card &&
        typeof card.card_id === "string" &&
        typeof card.bank_name === "string" &&
        typeof card.card_name === "string"
    ),
    rawSearch.filter(
      (card) =>
        card &&
        typeof card.card_id === "string" &&
        typeof card.bank_name === "string" &&
        typeof card.card_name === "string"
    ) as SearchCardInput[]
  )

  if (searchCards.length === 0) {
    return { error: "Add at least one card to your wallet first." }
  }

  return { category, url, searchCards, overrides }
}
