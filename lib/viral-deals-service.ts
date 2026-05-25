import { compareDealsByAvailability } from "@/lib/deal-availability"
import { SERPER_API_KEYS } from "@/lib/llm-router"
import { buildAllCatalogOffers } from "@/lib/deal-search-missing-cards"
import type { SearchCardInput } from "@/lib/deal-search"
import {
  fetchSerperPlatformCardOffers,
  fetchSerperShopping,
  parseInrPrice,
  type SerperDealContext,
} from "@/lib/serper-client"
import {
  catalogOfferToViralDeal,
  CURATED_LIVE_PRODUCTS,
  VIRAL_SHOPPING_QUERIES,
  type ViralDeal,
  type ViralDealsResult,
} from "@/lib/viral-deals"

type RawProduct = {
  title: string
  platform: string
  url?: string
  price: number
}

function productUrlForPlatform(platform: string, link?: string): string {
  if (link && /^https?:\/\//i.test(link)) return link
  const seed = VIRAL_SHOPPING_QUERIES.find((row) => row.platform === platform)
  return seed?.fallbackUrl ?? "https://www.amazon.in"
}

function dedupeProducts(products: RawProduct[]): RawProduct[] {
  const seen = new Set<string>()
  const output: RawProduct[] = []

  for (const product of products) {
    const key = product.title.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    output.push(product)
  }

  return output
}

async function loadPlatformSerper(platform: string): Promise<SerperDealContext> {
  const card_offer_snippets = await fetchSerperPlatformCardOffers(platform)

  return {
    used_serper: card_offer_snippets.length > 0,
    price: null,
    product_snippets: [],
    card_offer_snippets,
    shopping_results: [],
    queries_run: [`${platform} card offers`],
  }
}

function buildDealsForProduct(
  product: RawProduct,
  searchCards: SearchCardInput[],
  serperByPlatform: Map<string, SerperDealContext>
): ViralDeal[] {
  const serper =
    serperByPlatform.get(product.platform) ??
    ({
      used_serper: false,
      price: product.price,
      product_snippets: [],
      card_offer_snippets: [],
      shopping_results: [],
      queries_run: [],
    } satisfies SerperDealContext)

  const url = productUrlForPlatform(product.platform, product.url)
  const offers = buildAllCatalogOffers({
    url,
    estimatedPrice: product.price,
    searchCards,
    serper,
  })

  return offers.map((offer) => catalogOfferToViralDeal(product, offer))
}

async function loadSerperProducts(maxProducts: number): Promise<RawProduct[]> {
  if (SERPER_API_KEYS.length === 0) return []

  const shoppingBatches = await Promise.all(
    VIRAL_SHOPPING_QUERIES.map(async (row) => {
      const items = await fetchSerperShopping(row.query, 4)
      return items.map((item) => ({
        title: item.title?.trim() || "Trending product",
        platform: row.platform,
        url: item.link,
        price: parseInrPrice(item.price) ?? 0,
      }))
    })
  )

  return dedupeProducts(
    shoppingBatches
      .flat()
      .filter((p) => p.title.length > 4 && p.price > 0)
  ).slice(0, maxProducts)
}

export async function fetchViralDeals(
  searchCards: SearchCardInput[],
  limit = 48
): Promise<ViralDealsResult> {
  const walletCount = searchCards.filter((c) => c.source === "wallet").length
  const circleCount = searchCards.filter((c) => c.source === "circle").length

  let serperProducts = await loadSerperProducts(12)
  const usedSerper = serperProducts.length > 0

  if (serperProducts.length === 0) {
    serperProducts = CURATED_LIVE_PRODUCTS.map((p) => ({ ...p }))
  }

  const platforms = [...new Set(serperProducts.map((p) => p.platform))]
  const serperByPlatform = new Map<string, SerperDealContext>()

  await Promise.all(
    platforms.map(async (platform) => {
      if (SERPER_API_KEYS.length > 0) {
        serperByPlatform.set(platform, await loadPlatformSerper(platform))
      } else {
        serperByPlatform.set(platform, {
          used_serper: false,
          price: null,
          product_snippets: [],
          card_offer_snippets: [],
          shopping_results: [],
          queries_run: [],
        })
      }
    })
  )

  const allDeals: ViralDeal[] = []

  for (const product of serperProducts) {
    const rows = buildDealsForProduct(product, searchCards, serperByPlatform)
    allDeals.push(...rows)
  }

  allDeals.sort(compareDealsByAvailability)

  const deals = allDeals.slice(0, limit)

  const pingCount = deals.filter((d) => d.availability === "ping_to_split").length
  const circleDealCount = deals.filter((d) => d.availability === "circle").length
  const walletDealCount = deals.filter((d) => d.availability === "wallet").length

  const summary =
    deals.length > 0
      ? `${deals.length} deals · ${pingCount} ping to split · ${circleDealCount} circle · ${walletDealCount} wallet`
      : "Add a card to your wallet to unlock live deal rankings."

  return {
    deals,
    used_serper: usedSerper,
    wallet_excluded_count: walletCount,
    circle_count: circleCount,
    summary,
  }
}
