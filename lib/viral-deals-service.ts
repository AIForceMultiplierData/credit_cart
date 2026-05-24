import { SERPER_API_KEYS } from "@/lib/llm-router"
import { buildMissingCardTeasers } from "@/lib/deal-search-missing-cards"
import type { SearchCardInput } from "@/lib/deal-search"
import {
  fetchSerperPlatformCardOffers,
  fetchSerperShopping,
  parseInrPrice,
  type SerperDealContext,
} from "@/lib/serper-client"
import {
  missingTeaserToViralDeal,
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

function pickBestDealForProduct(
  product: RawProduct,
  searchCards: SearchCardInput[],
  serperByPlatform: Map<string, SerperDealContext>
): ViralDeal | null {
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
  const teasers = buildMissingCardTeasers({
    url,
    estimatedPrice: product.price,
    searchCards,
    offers: [],
    serper,
    limit: 1,
  })

  const best = teasers[0]
  if (!best) return null

  return missingTeaserToViralDeal(product, best)
}

export async function fetchViralDeals(
  searchCards: SearchCardInput[],
  limit = 8
): Promise<ViralDealsResult> {
  const walletExcluded = searchCards.filter((c) => c.source === "wallet").length

  if (SERPER_API_KEYS.length === 0) {
    return {
      deals: [],
      used_serper: false,
      wallet_excluded_count: walletExcluded,
      summary: "Serper not configured — add SERPER_KEYS on the server.",
    }
  }

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

  const rawProducts = dedupeProducts(
    shoppingBatches
      .flat()
      .filter((product) => product.title.length > 4 && product.price > 0)
  ).slice(0, limit * 2)

  if (rawProducts.length === 0) {
    return {
      deals: [],
      used_serper: false,
      wallet_excluded_count: walletExcluded,
      summary: "No live viral products found right now. Try again shortly.",
    }
  }

  const platforms = [...new Set(rawProducts.map((p) => p.platform))]
  const serperByPlatform = new Map<string, SerperDealContext>()

  await Promise.all(
    platforms.map(async (platform) => {
      serperByPlatform.set(platform, await loadPlatformSerper(platform))
    })
  )

  const deals: ViralDeal[] = []

  for (const product of rawProducts) {
    if (deals.length >= limit) break

    const deal = pickBestDealForProduct(product, searchCards, serperByPlatform)
    if (deal) {
      deals.push(deal)
    }
  }

  deals.sort((a, b) => b.cardDiscount - a.cardDiscount)

  return {
    deals,
    used_serper:
      deals.some((d) => d.source === "serper") || rawProducts.length > 0,
    wallet_excluded_count: walletExcluded,
    summary:
      deals.length > 0
        ? `${deals.length} deals with cards outside your wallet — pool for 50% cashback split.`
        : "All viral picks match cards already in your wallet. Add more platforms or cards.",
  }
}
