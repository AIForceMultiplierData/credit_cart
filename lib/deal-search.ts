export type DealSearchCategory = "flight" | "hotels" | "product"

export type WalletCardInput = {
  card_id: string
  bank_name: string
  card_name: string
}

export type DealOffer = {
  card_id: string
  bank_name: string
  card_name: string
  discount_percent: number
  discount_amount: number
  estimated_final_price: number | null
  reason: string
  recommended: boolean
}

export type DealSearchResult = {
  product_title: string
  platform: string
  category: DealSearchCategory
  source_url: string
  estimated_price: number | null
  best_offer: DealOffer | null
  offers: DealOffer[]
  summary: string
  used_ai: boolean
  used_serper: boolean
  data_sources: string[]
  market_offers: MarketOffer[]
}

export type MarketOffer = {
  title: string
  snippet: string
  source: string
  url?: string
}

const PLATFORM_RULES: Array<{
  pattern: RegExp
  platform: string
  cardMatchers: Array<{ pattern: RegExp; discountPercent: number; reason: string }>
}> = [
  {
    pattern: /amazon\.(in|com)/i,
    platform: "Amazon",
    cardMatchers: [
      {
        pattern: /amazon|icici/i,
        discountPercent: 5,
        reason: "ICICI Amazon Pay card typically earns 5% on Amazon India.",
      },
      {
        pattern: /millennia|hdfc/i,
        discountPercent: 5,
        reason: "HDFC Millennia often gives 5% cashback on Amazon spends.",
      },
    ],
  },
  {
    pattern: /flipkart\.com/i,
    platform: "Flipkart",
    cardMatchers: [
      {
        pattern: /flipkart|axis/i,
        discountPercent: 5,
        reason: "Axis Flipkart card is built for 5% unlimited cashback on Flipkart.",
      },
    ],
  },
  {
    pattern: /makemytrip|goibibo|cleartrip|ixigo|yatra/i,
    platform: "Travel",
    cardMatchers: [
      {
        pattern: /regalia|diners|magnus|sapphiro/i,
        discountPercent: 10,
        reason: "Premium travel cards often give accelerated rewards on OTAs.",
      },
      {
        pattern: /millennia|simplyclick|cashback/i,
        discountPercent: 5,
        reason: "Cashback cards can stack with OTA bank offers.",
      },
    ],
  },
]

export function normalizeCategory(value: string): DealSearchCategory | null {
  if (value === "flight" || value === "hotels" || value === "product") {
    return value
  }
  return null
}

export function detectPlatform(url: string): string {
  for (const rule of PLATFORM_RULES) {
    if (rule.pattern.test(url)) return rule.platform
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Unknown"
  }
}

export function buildFallbackResult(
  category: DealSearchCategory,
  url: string,
  walletCards: WalletCardInput[],
  estimatedPrice: number | null = null
): DealSearchResult {
  const platform = detectPlatform(url)
  const rule = PLATFORM_RULES.find((entry) => entry.pattern.test(url))

  const offers: DealOffer[] = walletCards.map((card) => {
    const label = `${card.bank_name} ${card.card_name}`
    const matcher = rule?.cardMatchers.find((entry) =>
      entry.pattern.test(label)
    )

    const discountPercent = matcher?.discountPercent ?? 2
    const discountAmount =
      estimatedPrice !== null
        ? Math.round((estimatedPrice * discountPercent) / 100)
        : 0
    const estimatedFinalPrice =
      estimatedPrice !== null ? estimatedPrice - discountAmount : null

    return {
      card_id: card.card_id,
      bank_name: card.bank_name,
      card_name: card.card_name,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      estimated_final_price: estimatedFinalPrice,
      reason:
        matcher?.reason ??
        `${label} may give ~${discountPercent}% value back on ${platform} via cashback or rewards.`,
      recommended: Boolean(matcher),
    }
  })

  offers.sort((a, b) => b.discount_percent - a.discount_percent)
  if (offers[0]) offers[0].recommended = true

  const bestOffer = offers[0] ?? null
  const categoryLabel =
    category === "flight"
      ? "flight booking"
      : category === "hotels"
        ? "hotel booking"
        : "product"

  return {
    product_title: `Your ${categoryLabel} link`,
    platform,
    category,
    source_url: url,
    estimated_price: estimatedPrice,
    best_offer: bestOffer,
    offers,
    summary: bestOffer
      ? `Use ${bestOffer.bank_name} ${bestOffer.card_name} for the strongest wallet match on ${platform}.`
      : "Add cards to your wallet to compare offers.",
    used_ai: false,
    used_serper: false,
    data_sources: ["rules"],
    market_offers: [],
  }
}

export const DEAL_SEARCH_SYSTEM_PROMPT = `You are PoolPay, an Indian fintech deal optimizer for India.
Given a purchase category, product/booking URL, pageHints, serperFindings (live Google search snippets), and ONLY the user's wallet credit cards, rank which card saves the most money.

Rules:
- Only recommend cards present in walletCards. Never invent cards.
- PRIORITIZE serperFindings.card_offer_snippets and serperFindings.shopping_results for live offer percentages when available.
- Use pageHints and serperFindings.product_snippets for product_title and estimated_price when URL scraping is weak.
- Use realistic Indian bank/card offers (cashback, instant discount, EMI, lounge/travel perks).
- Prefer platform-native cards (e.g. ICICI Amazon Pay on Amazon, Axis Flipkart on Flipkart).
- For flights/hotels, weigh travel rewards and OTA bank offers from serperFindings.
- estimated_price may be null if unknown; still provide percentage guidance.
- Cite specific offer details from serperFindings in each offer reason when possible.

Return ONLY valid JSON:
{
  "product_title": string,
  "platform": string,
  "estimated_price": number | null,
  "offers": [
    {
      "card_id": string,
      "bank_name": string,
      "card_name": string,
      "discount_percent": number,
      "discount_amount": number,
      "estimated_final_price": number | null,
      "reason": string,
      "recommended": boolean
    }
  ],
  "summary": string
}
Exactly one offer must have recommended=true (the best wallet card).`
