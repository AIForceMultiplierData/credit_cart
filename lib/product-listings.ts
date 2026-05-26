import type { TravelListing } from "@/lib/deal-search"
import { detectPlatform } from "@/lib/deal-search"
import type { ProductSearchParams } from "@/lib/product-search"
import { SERPER_API_KEYS } from "@/lib/llm-router"
import {
  fetchSerperShopping,
  parseInrPrice,
} from "@/lib/serper-client"

const STORE_QUERIES: Array<{
  provider: string
  querySuffix: string
  domain: RegExp
  fallbackSearch: (q: string) => string
}> = [
  {
    provider: "Amazon",
    querySuffix: "amazon.in",
    domain: /amazon\.(in|com)/i,
    fallbackSearch: (q) =>
      `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  },
  {
    provider: "Flipkart",
    querySuffix: "flipkart.com",
    domain: /flipkart\.com/i,
    fallbackSearch: (q) =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    provider: "Myntra",
    querySuffix: "myntra.com",
    domain: /myntra\.com/i,
    fallbackSearch: (q) =>
      `https://www.myntra.com/${encodeURIComponent(q).replace(/%20/g, "-")}`,
  },
  {
    provider: "Croma",
    querySuffix: "croma.com",
    domain: /croma\.com/i,
    fallbackSearch: (q) =>
      `https://www.croma.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    provider: "Reliance Digital",
    querySuffix: "reliancedigital.in",
    domain: /reliancedigital/i,
    fallbackSearch: (q) =>
      `https://www.reliancedigital.in/search?q=${encodeURIComponent(q)}`,
  },
]

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

function providerFromLink(link?: string, source?: string): string {
  if (source?.trim()) {
    const s = source.trim()
    if (/amazon/i.test(s)) return "Amazon"
    if (/flipkart/i.test(s)) return "Flipkart"
    if (/myntra/i.test(s)) return "Myntra"
    if (/croma/i.test(s)) return "Croma"
    return s
  }
  if (!link) return "Store"
  try {
    const host = new URL(link).hostname.replace(/^www\./, "")
    return detectPlatform(`https://${host}/`) || host
  } catch {
    return "Store"
  }
}

function listingFromSerper(
  item: {
    title?: string
    price?: string
    source?: string
    link?: string
  },
  query: string,
  index: number
): TravelListing | null {
  const price = parseInrPrice(item.price)
  if (!price || price <= 0) return null
  const provider = providerFromLink(item.link, item.source)
  const title = item.title?.trim() || query
  const url = item.link?.trim() || ""

  return {
    id: `prd-${provider.toLowerCase().replace(/\s+/g, "_")}-${index}`,
    category: "product",
    provider,
    title,
    subtitle: url ? new URL(url).hostname.replace(/^www\./, "") : provider,
    price,
    meta: ["Live price", provider],
    refundable: true,
    badge: undefined,
    product_url: url || undefined,
  }
}

function generateFallbackListings(query: string): TravelListing[] {
  const seed = hashSeed([query])
  const base = 2999 + (query.length % 12) * 400

  return STORE_QUERIES.map((store, i) => {
    const price = seededPrice(seed + i * 19, base, 18000)
    return {
      id: `prd-fallback-${store.provider}-${i}`,
      category: "product" as const,
      provider: store.provider,
      title: `${query} · ${store.provider}`,
      subtitle: "Estimated — pick after live search refreshes",
      price,
      meta: ["Estimated", store.provider],
      refundable: true,
      badge: i === 0 ? "Lowest est." : undefined,
      product_url: store.fallbackSearch(query),
    }
  })
}

function listingFromPastedUrl(
  url: string,
  query: string
): TravelListing | null {
  try {
    const parsed = new URL(url)
    const provider = detectPlatform(url)
    return {
      id: `prd-pasted-${provider}`,
      category: "product",
      provider,
      title: query || `Product on ${provider}`,
      subtitle: parsed.hostname.replace(/^www\./, ""),
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

export async function fetchProductListings(
  params: ProductSearchParams
): Promise<TravelListing[]> {
  const query = params.query.trim() || "product"
  const listings: TravelListing[] = []

  if (params.pastedUrl) {
    const pasted = listingFromPastedUrl(params.pastedUrl, query)
    if (pasted) listings.push(pasted)
  }

  if (SERPER_API_KEYS.length > 0) {
    const batches = await Promise.all(
      STORE_QUERIES.map((store) =>
        fetchSerperShopping(`${query} ${store.querySuffix}`, 2)
      )
    )

    const general = await fetchSerperShopping(
      `${query} buy online India price`,
      6
    )

    const seen = new Set<string>()
    const push = (row: TravelListing | null) => {
      if (!row) return
      const key = `${row.provider}:${Math.round(row.price / 100)}`
      if (seen.has(key)) return
      seen.add(key)
      listings.push(row)
    }

    batches.flat().forEach((item, i) => push(listingFromSerper(item, query, i)))
    general.forEach((item, i) => push(listingFromSerper(item, query, 100 + i)))
  }

  if (listings.length === 0) {
    return generateFallbackListings(query).map((row) => {
      if (
        params.pastedUrl &&
        row.provider === detectPlatform(params.pastedUrl) &&
        listings.length === 0
      ) {
        return { ...row, product_url: params.pastedUrl, badge: "Your URL" }
      }
      return row
    })
  }

  if (params.pastedUrl) {
    const pasted = listingFromPastedUrl(params.pastedUrl, query)
    if (pasted && !listings.some((l) => l.product_url === params.pastedUrl)) {
      listings.unshift(pasted)
    }
  }

  listings.sort((a, b) => {
    if (params.sort === "cheapest") return a.price - b.price
    return a.price - b.price
  })

  const cheapest = [...listings].sort((a, b) => a.price - b.price)[0]
  return listings.slice(0, 8).map((row) => ({
    ...row,
    badge:
      row.id === cheapest?.id && row.price > 0
        ? "Lowest price"
        : row.badge,
  }))
}

export function resolveProductListing(
  listings: TravelListing[],
  estimatedPrice: number | null,
  selectedListingId?: string | null
): { listing: TravelListing | null; price: number | null } {
  if (selectedListingId) {
    const picked = listings.find((l) => l.id === selectedListingId)
    if (picked) {
      const price =
        picked.price > 0 ? picked.price : estimatedPrice ?? null
      return { listing: picked, price }
    }
  }
  if (estimatedPrice != null && estimatedPrice > 0) {
    return { listing: listings[0] ?? null, price: estimatedPrice }
  }
  const first = listings.find((l) => l.price > 0) ?? listings[0]
  return { listing: first ?? null, price: first?.price ?? null }
}
