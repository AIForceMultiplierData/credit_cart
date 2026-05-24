import * as cheerio from "cheerio"
import { call_ai, safeJsonExtract } from "@/lib/llm-router"
import {
  buildFallbackResult,
  DEAL_SEARCH_SYSTEM_PROMPT,
  detectPlatform,
  normalizeCategory,
  type DealOffer,
  type DealSearchCategory,
  type DealSearchResult,
  type MarketOffer,
  type WalletCardInput,
} from "@/lib/deal-search"
import {
  fetchSerperDealContext,
  type SerperDealContext,
} from "@/lib/serper-client"

type SearchRequestBody = {
  category?: string
  url?: string
  walletCards?: WalletCardInput[]
}

type UrlHints = {
  title?: string
  price?: number | null
}

type AiDealPayload = {
  product_title?: string
  platform?: string
  estimated_price?: number | null
  offers?: DealOffer[]
  summary?: string
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
  offers: DealOffer[] | undefined,
  walletCards: WalletCardInput[],
  estimatedPrice: number | null,
  category: DealSearchCategory,
  url: string
): DealOffer[] {
  const walletById = new Map(walletCards.map((card) => [card.card_id, card]))

  const normalized = (offers ?? [])
    .filter((offer) => walletById.has(offer.card_id))
    .map((offer) => {
      const walletCard = walletById.get(offer.card_id)!
      const discountPercent = Number(offer.discount_percent) || 0
      const discountAmount =
        estimatedPrice !== null
          ? Math.round((estimatedPrice * discountPercent) / 100)
          : Number(offer.discount_amount) || 0

      return {
        card_id: walletCard.card_id,
        bank_name: walletCard.bank_name,
        card_name: walletCard.card_name,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        estimated_final_price:
          estimatedPrice !== null
            ? Math.max(estimatedPrice - discountAmount, 0)
            : offer.estimated_final_price ?? null,
        reason: offer.reason || "Wallet card offer",
        recommended: Boolean(offer.recommended),
      }
    })

  if (normalized.length === 0) {
    return buildFallbackResult(category, url, walletCards, estimatedPrice).offers
  }

  normalized.sort((a, b) => b.discount_percent - a.discount_percent)
  return normalized.map((offer, index) => ({
    ...offer,
    recommended: index === 0,
  }))
}

function attachSerperMetadata(
  result: DealSearchResult,
  hints: UrlHints,
  serper: SerperDealContext,
  usedAi: boolean
): DealSearchResult {
  return {
    ...result,
    product_title:
      result.product_title ||
      serper.product_title ||
      hints.title ||
      "Linked purchase",
    estimated_price:
      result.estimated_price ?? serper.price ?? hints.price ?? null,
    used_serper: serper.used_serper,
    data_sources: buildDataSources(hints, serper, usedAi),
    market_offers: buildMarketOffersFromSerper(serper),
  }
}

function buildAiResult(
  category: DealSearchCategory,
  url: string,
  walletCards: WalletCardInput[],
  aiPayload: AiDealPayload,
  hints: UrlHints,
  serper: SerperDealContext
): DealSearchResult {
  const estimatedPrice =
    aiPayload.estimated_price ?? serper.price ?? hints.price ?? null
  const offers = normalizeOffers(
    aiPayload.offers,
    walletCards,
    estimatedPrice,
    category,
    url
  )
  const bestOffer = offers.find((offer) => offer.recommended) ?? offers[0] ?? null

  const base: DealSearchResult = {
    product_title:
      aiPayload.product_title ||
      serper.product_title ||
      hints.title ||
      "Linked purchase",
    platform: aiPayload.platform || detectPlatform(url),
    category,
    source_url: url,
    estimated_price: estimatedPrice,
    best_offer: bestOffer,
    offers,
    summary:
      aiPayload.summary ||
      (bestOffer
        ? `Best wallet pick: ${bestOffer.bank_name} ${bestOffer.card_name}.`
        : "No wallet cards to compare."),
    used_ai: true,
    used_serper: serper.used_serper,
    data_sources: buildDataSources(hints, serper, true),
    market_offers: buildMarketOffersFromSerper(serper),
  }

  return attachSerperMetadata(base, hints, serper, true)
}

export async function searchDealsForWallet(
  category: DealSearchCategory,
  url: string,
  walletCards: WalletCardInput[]
): Promise<DealSearchResult> {
  const platform = detectPlatform(url)
  const hints = await fetchUrlHints(url)

  const serper = await fetchSerperDealContext({
    url,
    platform,
    category,
    walletCards,
    existingTitle: hints.title,
    existingPrice: hints.price ?? null,
  })

  const enrichedHints: UrlHints = {
    title: hints.title || serper.product_title,
    price: hints.price ?? serper.price ?? null,
  }

  try {
    const aiRaw = await call_ai(DEAL_SEARCH_SYSTEM_PROMPT, {
      category,
      url,
      platform,
      pageHints: enrichedHints,
      walletCards,
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
      walletCards,
      aiPayload,
      enrichedHints,
      serper
    )
  } catch {
    const fallback = buildFallbackResult(
      category,
      url,
      walletCards,
      enrichedHints.price ?? null
    )

    if (enrichedHints.title) {
      fallback.product_title = enrichedHints.title
    }

    return attachSerperMetadata(fallback, enrichedHints, serper, false)
  }
}

export function parseSearchRequestBody(body: SearchRequestBody): {
  category: DealSearchCategory
  url: string
  walletCards: WalletCardInput[]
} | { error: string } {
  const category = normalizeCategory(String(body.category ?? ""))
  const url = String(body.url ?? "").trim()
  const walletCards = Array.isArray(body.walletCards) ? body.walletCards : []

  if (!category) {
    return { error: "Select a category: flight, hotels, or product." }
  }

  if (!url) {
    return { error: "Paste a product or booking URL." }
  }

  if (!isValidHttpUrl(url)) {
    return { error: "Enter a valid http or https URL." }
  }

  if (walletCards.length === 0) {
    return { error: "Add at least one card to your wallet first." }
  }

  const sanitizedCards = walletCards
    .filter(
      (card) =>
        card &&
        typeof card.card_id === "string" &&
        typeof card.bank_name === "string" &&
        typeof card.card_name === "string"
    )
    .map((card) => ({
      card_id: card.card_id,
      bank_name: card.bank_name,
      card_name: card.card_name,
    }))

  if (sanitizedCards.length === 0) {
    return { error: "Wallet cards are invalid. Re-add cards in Wallet." }
  }

  return { category, url, walletCards: sanitizedCards }
}
