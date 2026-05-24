import type { DealSearchCategory } from "@/lib/deal-search"

export type CardOfferRule = {
  card_id: string
  /** Match purchase URL or platform name */
  urlPattern: RegExp
  categories?: DealSearchCategory[]
  /** Base reward rate used when Serper/AI does not override */
  basePercent: number
  /** Max cashback/reward per transaction in INR */
  capPerTransaction?: number
  /** Minimum spend to qualify */
  minTransaction?: number
  terms: string[]
}

export const CARD_OFFER_RULES: CardOfferRule[] = [
  {
    card_id: "icici_amazon",
    urlPattern: /amazon\.(in|com)/i,
    categories: ["product"],
    basePercent: 5,
    capPerTransaction: 5_000,
    minTransaction: 100,
    terms: [
      "5% unlimited cashback on Amazon.in for Amazon Pay ICICI cardholders.",
      "Cashback credited to Amazon Pay balance (not bank account).",
      "Valid only on Amazon.in — not on third-party sellers unless eligible.",
      "No minimum monthly cap on 5% tier for standard Amazon spends.",
      "Prime, gift cards, and gold may be excluded per bank T&C.",
    ],
  },
  {
    card_id: "hdfc_millennia",
    urlPattern: /amazon\.(in|com)/i,
    categories: ["product"],
    basePercent: 5,
    capPerTransaction: 1_000,
    minTransaction: 500,
    terms: [
      "5% cashback on Amazon via SmartBuy / partner merchant category.",
      "Monthly cap typically ₹1,000 on 5% accelerated category.",
      "Cashback posted as reward points — redeem per HDFC rewards rules.",
      "Must pay with HDFC Millennia on eligible Amazon checkout.",
      "Stacking with Amazon coupons subject to bank + merchant rules.",
    ],
  },
  {
    card_id: "axis_flipkart",
    urlPattern: /flipkart\.com/i,
    categories: ["product"],
    basePercent: 5,
    capPerTransaction: 10_000,
    minTransaction: 100,
    terms: [
      "5% unlimited cashback on Flipkart for Axis Flipkart credit card.",
      "Cashback credited to Flipkart wallet / statement per Axis T&C.",
      "Valid on Flipkart.com and Flipkart app checkout only.",
      "EMI, gift cards, and certain categories may be excluded.",
      "Card must be active and in good standing at settlement.",
    ],
  },
  {
    card_id: "hdfc_regalia",
    urlPattern: /makemytrip|goibibo|cleartrip|ixigo|yatra|booking\.com|oyo/i,
    categories: ["flight", "hotels"],
    basePercent: 10,
    capPerTransaction: 5_000,
    minTransaction: 2_000,
    terms: [
      "Accelerated reward points on travel / OTA spends via SmartBuy.",
      "Effective value ~10% when redeemed for flights/hotels per HDFC grid.",
      "SmartBuy portal booking may be required for best earn rate.",
      "Taxes, convenience fees, and wallet loads often excluded.",
      "Reward redemption subject to HDFC Regalia Gold program rules.",
    ],
  },
  {
    card_id: "hdfc_diners",
    urlPattern: /makemytrip|goibibo|cleartrip|ixigo|yatra|booking\.com|oyo/i,
    categories: ["flight", "hotels"],
    basePercent: 10,
    capPerTransaction: 8_000,
    minTransaction: 2_000,
    terms: [
      "Premium travel rewards on OTAs — typically 10%+ effective on spends.",
      "Lounge, golf, and milestone benefits per Diners Club Black T&C.",
      "Direct merchant spend may earn lower base rate vs SmartBuy.",
      "International bookings: forex markup + reward caps apply.",
      "Verify current HDFC Diners earn chart before large bookings.",
    ],
  },
  {
    card_id: "axis_magnus",
    urlPattern: /makemytrip|goibibo|cleartrip|ixigo|yatra|booking\.com|oyo/i,
    categories: ["flight", "hotels"],
    basePercent: 10,
    capPerTransaction: 6_000,
    minTransaction: 2_000,
    terms: [
      "Accelerated EDGE reward points on travel merchant category.",
      "Effective ~10% when points redeemed at Axis Travel Edge rate.",
      "Direct OTA checkout must use Axis Magnus credit card.",
      "Promo bank offers on OTA may stack — check issuer page.",
      "Annual fee waiver and caps per Axis Magnus product T&C.",
    ],
  },
  {
    card_id: "sbi_cashback",
    urlPattern: /./,
    basePercent: 5,
    capPerTransaction: 5_000,
    minTransaction: 500,
    terms: [
      "5% cashback on online spends (category caps apply per SBI).",
      "1% on other spends — verify MCC for your merchant.",
      "Cashback credited to statement; monthly caps may apply.",
      "Must use SBI Cashback card at checkout for eligibility.",
    ],
  },
  {
    card_id: "sbi_simplyclick",
    urlPattern: /amazon|flipkart|makemytrip|bookmyshow/i,
    basePercent: 5,
    capPerTransaction: 2_500,
    minTransaction: 500,
    terms: [
      "5X–10X rewards on partner online merchants per SimplyCLICK grid.",
      "Partner list includes Amazon, Flipkart, MMT — verify live list.",
      "Reward points redemption value depends on SBI catalogue.",
      "Welcome benefits and caps per card member agreement.",
    ],
  },
  {
    card_id: "icici_sapphiro",
    urlPattern: /makemytrip|goibibo|cleartrip|booking\.com|oyo/i,
    categories: ["flight", "hotels"],
    basePercent: 8,
    capPerTransaction: 4_000,
    minTransaction: 1_500,
    terms: [
      "Premium reward points on travel and dining categories.",
      "Effective value up to ~8% on eligible OTA spends.",
      "Airport lounge access per ICICI Sapphiro program rules.",
      "Forex markup on international travel bookings applies.",
    ],
  },
]

const DEFAULT_RULE: Omit<CardOfferRule, "card_id" | "urlPattern"> = {
  basePercent: 2,
  capPerTransaction: 500,
  minTransaction: 500,
  terms: [
    "Generic ~2% value back estimate — verify live issuer T&C.",
    "Merchant category (MCC) must match reward category.",
    "Cashback/rewards post after statement cycle (typically 30–90 days).",
    "Bank promo codes and instant discounts may differ from reward rate.",
  ],
}

export function findCardOfferRule(input: {
  card_id: string
  url: string
  category: DealSearchCategory
}): CardOfferRule {
  const matches = CARD_OFFER_RULES.filter(
    (rule) =>
      rule.card_id === input.card_id &&
      rule.urlPattern.test(input.url) &&
      (!rule.categories || rule.categories.includes(input.category))
  )

  if (matches.length > 0) {
    return matches[0]
  }

  const cardFallback = CARD_OFFER_RULES.find(
    (rule) => rule.card_id === input.card_id && rule.urlPattern.test("./")
  )

  if (cardFallback) {
    return cardFallback
  }

  return {
    card_id: input.card_id,
    urlPattern: /.*/,
    ...DEFAULT_RULE,
  }
}
