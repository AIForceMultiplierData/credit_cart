export type DealSearchCategory = "flight" | "hotels" | "product"

export type WalletCardInput = {
  card_id: string
  bank_name: string
  card_name: string
}

export type SearchCardInput = WalletCardInput & {
  source: "wallet" | "circle"
  owner_user_id?: string
  owner_name?: string
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
  source: "wallet" | "circle"
  owner_user_id?: string
  owner_name?: string
  serper_backed?: boolean
  /** List / MRP price used for calculation */
  list_price?: number | null
  /** Exact amount charged at checkout after card discount */
  amount_to_pay?: number | null
  /** Issuer terms to avail the quoted discount */
  terms_and_conditions?: string[]
  /** Whether spend meets min transaction rules */
  qualifies?: boolean
  qualification_note?: string
  /** Circle pool: your half of cashback */
  your_cashback_share?: number | null
  /** Circle pool: card owner's half */
  circle_owner_share?: number | null
  /** Your true cost after cashback (100% wallet, 50% circle) */
  effective_cost?: number | null
  is_pooled?: boolean
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
  missing_card_teasers: MissingCardTeaser[]
  wallet_card_count: number
  circle_card_count: number
}

export type MarketOffer = {
  title: string
  snippet: string
  source: string
  url?: string
}

export type MissingCardTeaser = {
  card_id: string
  bank_name: string
  bank_logo_url?: string | null
  card_name: string
  style_classes: string
  discount_percent: number
  discount_amount: number
  reason: string
  in_circle: boolean
  circle_owner_name?: string
  serper_backed: boolean
  apply_url: string
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
  searchCards: SearchCardInput[],
  estimatedPrice: number | null = null
): DealSearchResult {
  const platform = detectPlatform(url)
  const rule = PLATFORM_RULES.find((entry) => entry.pattern.test(url))

  const offers: DealOffer[] = searchCards.map((card) => {
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
      recommended: false,
      source: card.source,
      owner_user_id: card.owner_user_id,
      owner_name: card.owner_name,
      serper_backed: false,
    }
  })

  offers.sort((a, b) => {
    if (estimatedPrice !== null) {
      return b.discount_amount - a.discount_amount
    }
    return b.discount_percent - a.discount_percent
  })
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
    missing_card_teasers: [],
    wallet_card_count: searchCards.filter((c) => c.source === "wallet").length,
    circle_card_count: searchCards.filter((c) => c.source === "circle").length,
  }
}

export const DEAL_SEARCH_SYSTEM_PROMPT = `You are PoolPay, an Indian fintech deal optimizer for India.
Given a purchase category, product/booking URL, pageHints, serperFindings (live Google search snippets), and searchCards (user wallet + trusted circle cards), rank which card saves the most money.

Rules:
- Only recommend cards present in searchCards. Never invent cards.
- searchCards includes source: "wallet" (user's own) or "circle" (trusted friend's card they can pool).
- PRIORITIZE serperFindings.card_offer_snippets — when a snippet mentions a card, use that live percentage over generic guesses.
- Use pageHints and serperFindings.product_snippets for product_title and estimated_price when URL scraping is weak.
- Rank primarily by estimated rupee savings (discount_amount), not marketing fluff.
- Prefer platform-native cards (e.g. ICICI Amazon Pay on Amazon, Axis Flipkart on Flipkart).
- For flights/hotels, weigh travel rewards and OTA bank offers from serperFindings.
- Include owner_name in reason when source is circle (e.g. "Raj's HDFC Regalia via circle").
- Return one offer row per searchCards entry (match card_id + owner_user_id when present).
- For each offer include terms_and_conditions: string[] with ALL key conditions to avail the discount (caps, min spend, merchant restrictions, posting timeline).
- discount_amount and estimated_final_price must be exact INR math from estimated_price × discount_percent, respecting caps you know.
- When source is "circle", note in terms that PoolPay splits cashback 50/50 with the card owner.

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
      "recommended": boolean,
      "terms_and_conditions": string[]
    }
  ],
  "summary": string
}
Exactly one offer must have recommended=true (highest rupee savings when price known).`
