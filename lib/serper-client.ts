import { SERPER_API_KEYS } from "@/lib/llm-router"

const SERPER_SEARCH_URL = "https://google.serper.dev/search"
const SERPER_SHOPPING_URL = "https://google.serper.dev/shopping"

let serperKeyIndex = 0

export type SerperOrganicResult = {
  title: string
  link: string
  snippet: string
}

export type SerperShoppingResult = {
  title: string
  price?: string
  source?: string
  link?: string
}

type SerperSearchResponse = {
  organic?: SerperOrganicResult[]
  answerBox?: {
    title?: string
    answer?: string
    snippet?: string
  }
  shopping?: SerperShoppingResult[]
}

export type SerperDealContext = {
  used_serper: boolean
  product_title?: string
  price: number | null
  product_snippets: SerperOrganicResult[]
  card_offer_snippets: SerperOrganicResult[]
  shopping_results: SerperShoppingResult[]
  queries_run: string[]
}

function nextSerperKey(): string | null {
  if (SERPER_API_KEYS.length === 0) return null
  const key = SERPER_API_KEYS[serperKeyIndex]
  serperKeyIndex = (serperKeyIndex + 1) % SERPER_API_KEYS.length
  return key ?? null
}

function parseInrPrice(raw: string | undefined): number | null {
  if (!raw) return null
  const normalized = raw.replace(/,/g, "")
  const match = normalized.match(/(?:₹|Rs\.?\s*)?(\d+(?:\.\d+)?)/i)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

function dedupeOrganic(
  rows: SerperOrganicResult[]
): SerperOrganicResult[] {
  const seen = new Set<string>()
  const output: SerperOrganicResult[] = []

  for (const row of rows) {
    const key = row.link || row.title
    if (seen.has(key)) continue
    seen.add(key)
    output.push(row)
  }

  return output
}

async function serperPost<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T | null> {
  const attempts = Math.max(SERPER_API_KEYS.length, 1)

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const apiKey = nextSerperKey()
    if (!apiKey) return null

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gl: "in",
          hl: "en",
          num: 8,
          ...body,
        }),
      })

      if (!response.ok) continue
      return (await response.json()) as T
    } catch {
      continue
    }
  }

  return null
}

function extractAmazonAsin(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1].toUpperCase()
  }

  return null
}

function buildProductQuery(
  url: string,
  platform: string,
  category: string
): string {
  const asin = extractAmazonAsin(url)

  if (asin && /amazon/i.test(platform)) {
    return `site:amazon.in ${asin} price`
  }

  if (/amazon/i.test(platform)) {
    return `site:amazon.in ${url}`
  }

  if (/flipkart/i.test(platform)) {
    return `site:flipkart.com ${url}`
  }

  if (category === "flight") {
    return `${url} flight booking price India credit card offer`
  }

  if (category === "hotels") {
    return `${url} hotel booking price India credit card offer`
  }

  return `${platform} ${url} price India`
}

function buildCardOffersQuery(
  platform: string,
  category: string,
  walletCards: Array<{ bank_name: string; card_name: string }>
): string {
  const cardLabels = walletCards
    .map((card) => `${card.bank_name} ${card.card_name}`)
    .join(" OR ")

  const vertical =
    category === "flight"
      ? "flight booking"
      : category === "hotels"
        ? "hotel booking"
        : "online shopping"

  return `${platform} ${vertical} credit card offer cashback India 2025 2026 (${cardLabels})`
}

export async function fetchSerperDealContext(input: {
  url: string
  platform: string
  category: string
  walletCards: Array<{ bank_name: string; card_name: string }>
  existingTitle?: string
  existingPrice?: number | null
}): Promise<SerperDealContext> {
  const empty: SerperDealContext = {
    used_serper: false,
    price: input.existingPrice ?? null,
    product_snippets: [],
    card_offer_snippets: [],
    shopping_results: [],
    queries_run: [],
  }

  if (SERPER_API_KEYS.length === 0) {
    return empty
  }

  const productQuery = buildProductQuery(
    input.url,
    input.platform,
    input.category
  )
  const offersQuery = buildCardOffersQuery(
    input.platform,
    input.category,
    input.walletCards
  )

  const needsProductSearch =
    !input.existingTitle ||
    input.existingPrice === null ||
    input.existingPrice === undefined

  const [productSearch, offersSearch, shoppingSearch] = await Promise.all([
    needsProductSearch
      ? serperPost<SerperSearchResponse>(SERPER_SEARCH_URL, { q: productQuery })
      : Promise.resolve(null),
    serperPost<SerperSearchResponse>(SERPER_SEARCH_URL, { q: offersQuery }),
    needsProductSearch && /amazon|flipkart|product/i.test(input.platform)
      ? serperPost<SerperSearchResponse>(SERPER_SHOPPING_URL, {
          q: input.existingTitle || productQuery,
        })
      : Promise.resolve(null),
  ])

  const productSnippets = dedupeOrganic([
    ...(productSearch?.organic ?? []),
    ...(productSearch?.answerBox?.title
      ? [
          {
            title: productSearch.answerBox.title,
            link: input.url,
            snippet:
              productSearch.answerBox.snippet ||
              productSearch.answerBox.answer ||
              "",
          },
        ]
      : []),
  ]).slice(0, 6)

  const cardOfferSnippets = dedupeOrganic(offersSearch?.organic ?? []).slice(
    0,
    8
  )

  const shoppingResults = (shoppingSearch?.shopping ?? []).slice(0, 5)

  const used_serper =
    productSnippets.length > 0 ||
    cardOfferSnippets.length > 0 ||
    shoppingResults.length > 0

  if (!used_serper) {
    return empty
  }

  let product_title = input.existingTitle
  let price = input.existingPrice ?? null

  if (!product_title) {
    product_title =
      shoppingResults[0]?.title ||
      productSnippets.find((row) => row.title.length > 8)?.title
  }

  if (price === null) {
    for (const item of shoppingResults) {
      const parsed = parseInrPrice(item.price)
      if (parsed !== null) {
        price = parsed
        break
      }
    }

    if (price === null) {
      for (const row of productSnippets) {
        const parsed = parseInrPrice(`${row.title} ${row.snippet}`)
        if (parsed !== null) {
          price = parsed
          break
        }
      }
    }
  }

  return {
    used_serper: true,
    product_title,
    price,
    product_snippets: productSnippets,
    card_offer_snippets: cardOfferSnippets,
    shopping_results: shoppingResults,
    queries_run: [
      ...(needsProductSearch ? [productQuery] : []),
      offersQuery,
      ...(shoppingSearch ? [input.existingTitle || productQuery] : []),
    ],
  }
}
