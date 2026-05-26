import type { TravelListing } from "@/lib/deal-search"
import { detectPlatform } from "@/lib/deal-search"
import {
  inferProductIntent,
  isAccessoryListing,
  isPhoneDeviceListing,
  titleMatchesQuery,
  type ProductIntent,
} from "@/lib/product-query-intent"
import { parseProductVariantHints } from "@/lib/product-variant-parse"
import { buildProductShoppingQueries } from "@/lib/search-category-rules"

export type ListingsFetchResult = {
  listings: TravelListing[]
  raw_listings: TravelListing[]
  serper_queries: string[]
}
import type { ProductSearchParams } from "@/lib/product-search"
import { SERPER_API_KEYS } from "@/lib/llm-router"
import {
  fetchSerperShopping,
  parseInrPrice,
} from "@/lib/serper-client"

const MAJOR_STORES: Array<{
  provider: string
  domain: RegExp
  searchUrl: (q: string) => string
  shoppingQuery: (q: string) => string
}> = [
  {
    provider: "Amazon",
    domain: /amazon\.(in|com)/i,
    searchUrl: (q) =>
      `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
    shoppingQuery: (q) => `${q} smartphone buy amazon.in -case -cover`,
  },
  {
    provider: "Flipkart",
    domain: /flipkart\.com/i,
    searchUrl: (q) =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
    shoppingQuery: (q) => `${q} buy flipkart.com mobile phone -case -cover`,
  },
  {
    provider: "Croma",
    domain: /croma\.com/i,
    searchUrl: (q) =>
      `https://www.croma.com/search?q=${encodeURIComponent(q)}`,
    shoppingQuery: (q) => `${q} buy croma.com -case`,
  },
  {
    provider: "Reliance Digital",
    domain: /reliancedigital/i,
    searchUrl: (q) =>
      `https://www.reliancedigital.in/search?q=${encodeURIComponent(q)}`,
    shoppingQuery: (q) => `${q} buy reliancedigital.in`,
  },
  {
    provider: "Vijay Sales",
    domain: /vijaysales/i,
    searchUrl: (q) =>
      `https://www.vijaysales.com/search?q=${encodeURIComponent(q)}`,
    shoppingQuery: (q) => `${q} vijaysales.com mobile`,
  },
  {
    provider: "eBay",
    domain: /ebay\.(in|com)/i,
    searchUrl: (q) =>
      `https://www.ebay.in/sch/i.html?_nkw=${encodeURIComponent(q)}`,
    shoppingQuery: (q) => `${q} buy ebay.in india -case -cover`,
  },
]

const BLOCKED_URL_HOSTS =
  /google\.com|google\.co\.in|sharepal|goo\.gl|webcache/i

function hashSeed(parts: string[]): number {
  let h = 0
  const s = parts.join("|")
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

function seededPrice(seed: number, min: number, spread: number): number {
  const n = (seed % 1000) / 1000
  return Math.round(min + n * spread)
}

function resolveStoreFromItem(
  link: string | undefined,
  source: string | undefined
): (typeof MAJOR_STORES)[number] | null {
  if (link) {
    try {
      const host = new URL(link).hostname
      const found = MAJOR_STORES.find((s) => s.domain.test(host))
      if (found) return found
    } catch {
      /* ignore */
    }
  }
  if (source) {
    const found = MAJOR_STORES.find((s) =>
      s.provider.toLowerCase().includes(source.toLowerCase().slice(0, 4))
    )
    if (found) return found
    if (/amazon/i.test(source)) return MAJOR_STORES[0]
    if (/flipkart/i.test(source)) return MAJOR_STORES[1]
    if (/croma/i.test(source)) return MAJOR_STORES[2]
  }
  return null
}

function productUrlForStore(
  store: (typeof MAJOR_STORES)[number],
  rawLink: string | undefined,
  query: string
): string {
  if (rawLink && !BLOCKED_URL_HOSTS.test(rawLink)) {
    try {
      const host = new URL(rawLink).hostname
      if (store.domain.test(host)) return rawLink
    } catch {
      /* fall through */
    }
  }
  return store.searchUrl(query)
}

function scoreListing(
  listing: TravelListing,
  query: string,
  intent: ProductIntent
): number {
  const title = listing.title

  if (isAccessoryListing(title, intent)) return -1_000
  if (intent.kind === "phone" && !isPhoneDeviceListing(title, intent)) {
    return -800
  }
  if (listing.price < intent.minPrice || listing.price > intent.maxPrice) {
    return -500
  }
  if (!titleMatchesQuery(title, query)) return -200

  let score = 100
  if (MAJOR_STORES.some((s) => s.provider === listing.provider)) score += 80
  if (listing.product_url && !BLOCKED_URL_HOSTS.test(listing.product_url)) {
    score += 40
  }
  if (intent.kind === "phone" && /\b(128gb|256gb|512gb|1tb)\b/i.test(title)) {
    score += 30
  }
  if (intent.kind === "phone" && /\bpro\s*max|\bpro\b|\bplus\b/i.test(title)) {
    score += 15
  }

  return score
}

function listingFromSerper(
  item: {
    title?: string
    price?: string
    source?: string
    link?: string
  },
  query: string,
  intent: ProductIntent,
  index: number
): TravelListing | null {
  const price = parseInrPrice(item.price)
  if (!price || price <= 0) return null

  const title = item.title?.trim() || query
  if (isAccessoryListing(title, intent)) return null
  if (intent.kind === "phone" && !isPhoneDeviceListing(title, intent)) return null
  if (price < intent.minPrice || price > intent.maxPrice) return null

  const store = resolveStoreFromItem(item.link, item.source)
  const provider = store?.provider ?? "Store"

  if (!store && BLOCKED_URL_HOSTS.test(item.link ?? "")) {
    return null
  }

  const product_url = store
    ? productUrlForStore(store, item.link, query)
    : item.link?.trim() || undefined

  const variants = parseProductVariantHints(title)
  const listing: TravelListing = {
    id: `prd-${provider.toLowerCase().replace(/\s+/g, "_")}-${index}`,
    category: "product",
    provider,
    title,
    subtitle: variants.variant_label ?? store?.provider ?? provider,
    price,
    meta: [
      "Live price",
      provider,
      ...(variants.storage_gb ? [variants.storage_gb] : []),
      ...(variants.color ? [variants.color] : []),
    ],
    refundable: true,
    product_url,
    ...variants,
  }

  return scoreListing(listing, query, intent) >= 0 ? listing : null
}

function generateFallbackListings(
  query: string,
  intent: ProductIntent
): TravelListing[] {
  const seed = hashSeed([query, intent.kind])
  const min =
    intent.kind === "phone"
      ? 72_000
      : intent.kind === "laptop"
        ? 42_000
        : 4_999
  const spread =
    intent.kind === "phone"
      ? 65_000
      : intent.kind === "laptop"
        ? 80_000
        : 25_000

  return MAJOR_STORES.map((store, i) => {
    const price = seededPrice(seed + i * 19, min, spread)
    return {
      id: `prd-fallback-${store.provider}-${i}`,
      category: "product" as const,
      provider: store.provider,
      title: `${query} · ${store.provider}`,
      subtitle: `${store.provider} search`,
      price,
      meta: ["Estimated", store.provider],
      refundable: true,
      badge: undefined,
      product_url: store.searchUrl(query),
    }
  })
}

function listingFromPastedUrl(
  url: string,
  query: string
): TravelListing | null {
  try {
    const provider = detectPlatform(url)
    if (!/^https?:\/\//i.test(url)) return null
    return {
      id: `prd-pasted-${provider}`,
      category: "product",
      provider,
      title: query || `Product on ${provider}`,
      subtitle: new URL(url).hostname.replace(/^www\./, ""),
      price: 0,
      meta: ["Your link", provider],
      refundable: true,
      badge: "Your URL",
      product_url: url,
    }
  } catch {
    return null
  }
}

function pickDefaultListing(
  listings: TravelListing[],
  query: string,
  intent: ProductIntent
): TravelListing | null {
  const scored = listings
    .map((l) => ({ l, s: scoreListing(l, query, intent) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s
      return a.l.price - b.l.price
    })

  return scored[0]?.l ?? listings.find((l) => l.price >= intent.minPrice) ?? null
}

function listingFromSerperRaw(
  item: {
    title?: string
    price?: string
    source?: string
    link?: string
  },
  query: string,
  intent: ProductIntent,
  index: number
): TravelListing | null {
  const price = parseInrPrice(item.price)
  if (!price || price <= 0) return null
  const title = item.title?.trim() || query
  const store = resolveStoreFromItem(item.link, item.source)
  const provider = store?.provider ?? item.source ?? "Store"
  const product_url = store
    ? productUrlForStore(store, item.link, query)
    : item.link?.trim() || undefined
  const variants = parseProductVariantHints(title)
  return {
    id: `prd-raw-${index}`,
    category: "product",
    provider,
    title,
    subtitle: variants.variant_label ?? provider,
    price,
    meta: ["Raw Serper", provider],
    refundable: true,
    product_url,
    ...variants,
  }
}

export async function fetchProductListings(
  params: ProductSearchParams
): Promise<ListingsFetchResult> {
  const query = params.query.trim() || "product"
  const intent = inferProductIntent(query)
  const listings: TravelListing[] = []
  const raw_listings: TravelListing[] = []
  const serper_queries = buildProductShoppingQueries(params)

  if (params.pastedUrl) {
    const pasted = listingFromPastedUrl(params.pastedUrl, query)
    if (pasted) listings.push(pasted)
  }

  if (SERPER_API_KEYS.length > 0) {
    const perStore = await Promise.all(
      MAJOR_STORES.map((store) =>
        fetchSerperShopping(store.shoppingQuery(query), 4)
      )
    )

    const generalQueries =
      serper_queries.length > 0
        ? serper_queries
        : [`${query} price india ${intent.kind} -case -cover -rental`]
    const generalBatches = await Promise.all(
      generalQueries.map((q) => fetchSerperShopping(q, 6))
    )

    const byProvider = new Map<string, TravelListing>()

    const consider = (row: TravelListing | null) => {
      if (!row) return
      const score = scoreListing(row, query, intent)
      if (score < 0) return
      const existing = byProvider.get(row.provider)
      if (!existing || scoreListing(row, query, intent) > scoreListing(existing, query, intent)) {
        byProvider.set(row.provider, row)
      } else if (
        existing &&
        row.price > 0 &&
        row.price < existing.price &&
        scoreListing(row, query, intent) >= scoreListing(existing, query, intent) - 10
      ) {
        byProvider.set(row.provider, row)
      }
    }

    let idx = 0
    for (const batch of perStore) {
      for (const item of batch) {
        const raw = listingFromSerperRaw(item, query, intent, idx)
        if (raw) raw_listings.push(raw)
        consider(listingFromSerper(item, query, intent, idx))
        idx += 1
      }
    }
    for (const batch of generalBatches) {
      for (const item of batch) {
        const raw = listingFromSerperRaw(item, query, intent, idx)
        if (raw) raw_listings.push(raw)
        consider(listingFromSerper(item, query, intent, idx))
        idx += 1
      }
    }

    listings.push(...byProvider.values())
  }

  let output =
    listings.length > 0 ? [...listings] : generateFallbackListings(query, intent)
  if (raw_listings.length === 0) {
    raw_listings.push(...output)
  }

  if (params.pastedUrl) {
    const pasted = listingFromPastedUrl(params.pastedUrl, query)
    if (pasted && !output.some((l) => l.product_url === params.pastedUrl)) {
      output.unshift(pasted)
    }
  }

  output = output
    .filter((l) => scoreListing(l, query, intent) >= 0 || l.badge === "Your URL")
    .sort((a, b) => {
      const sa = scoreListing(a, query, intent)
      const sb = scoreListing(b, query, intent)
      if (sb !== sa) return sb - sa
      if (params.sort === "cheapest") return a.price - b.price
      return a.price - b.price
    })

  if (output.length === 0) {
    output = generateFallbackListings(query, intent)
  }

  const defaultPick = pickDefaultListing(output, query, intent)
  const cheapestAmongValid = [...output]
    .filter((l) => l.price >= intent.minPrice)
    .sort((a, b) => a.price - b.price)[0]

  const listingsOut = output.slice(0, 8).map((row) => ({
    ...row,
    subtitle:
      row.product_url && !BLOCKED_URL_HOSTS.test(row.product_url)
        ? (() => {
            try {
              return new URL(row.product_url).hostname.replace(/^www\./, "")
            } catch {
              return row.subtitle
            }
          })()
        : row.subtitle,
    badge:
      row.id === defaultPick?.id
        ? "Best match"
        : row.id === cheapestAmongValid?.id &&
            cheapestAmongValid.id !== defaultPick?.id
          ? "Lowest price"
          : row.badge,
  }))

  return {
    listings: listingsOut,
    raw_listings,
    serper_queries,
  }
}

export function resolveProductListing(
  listings: TravelListing[],
  estimatedPrice: number | null,
  selectedListingId?: string | null,
  query?: string
): { listing: TravelListing | null; price: number | null } {
  const intent = inferProductIntent(query ?? "")

  if (selectedListingId) {
    const picked = listings.find((l) => l.id === selectedListingId)
    if (picked) {
      const price =
        picked.price >= intent.minPrice
          ? picked.price
          : estimatedPrice ?? null
      return { listing: picked, price }
    }
  }

  const best = pickDefaultListing(listings, query ?? "", intent)
  if (best && best.price >= intent.minPrice) {
    return { listing: best, price: best.price }
  }

  if (estimatedPrice != null && estimatedPrice >= intent.minPrice) {
    return { listing: best ?? listings[0] ?? null, price: estimatedPrice }
  }

  const priced = listings.find((l) => l.price >= intent.minPrice)
  return {
    listing: priced ?? best ?? listings[0] ?? null,
    price: priced?.price ?? null,
  }
}
