import type { MissingCardTeaser } from "@/lib/deal-search"

export type ViralDeal = {
  id: string
  title: string
  platform: string
  productUrl?: string
  originalPrice: number
  discountedPrice: number
  cardId: string
  cardBankName: string
  cardName: string
  cardLabel: string
  cardDiscount: number
  discountPercent: number
  styleClasses: string
  inCircle: boolean
  circleOwnerName?: string
  serperBacked: boolean
  splitHint: string
  source: "serper" | "catalog"
}

export type ViralDealsResult = {
  deals: ViralDeal[]
  used_serper: boolean
  wallet_excluded_count: number
  summary: string
}

export const VIRAL_SHOPPING_QUERIES: Array<{
  platform: string
  query: string
  fallbackUrl: string
}> = [
  {
    platform: "Amazon",
    query: "best seller electronics amazon.in India 2026",
    fallbackUrl: "https://www.amazon.in",
  },
  {
    platform: "Amazon",
    query: "trending headphones laptop amazon india deal",
    fallbackUrl: "https://www.amazon.in",
  },
  {
    platform: "Flipkart",
    query: "flipkart trending mobile laptop deals India",
    fallbackUrl: "https://www.flipkart.com",
  },
  {
    platform: "Flipkart",
    query: "flipkart best selling electronics cashback offer",
    fallbackUrl: "https://www.flipkart.com",
  },
  {
    platform: "eBay",
    query: "ebay trending electronics deals free shipping",
    fallbackUrl: "https://www.ebay.com",
  },
]

export function missingTeaserToViralDeal(
  product: {
    title: string
    platform: string
    url?: string
    price: number
  },
  teaser: MissingCardTeaser
): ViralDeal {
  const cardDiscount = teaser.discount_amount
  const discountedPrice = Math.max(product.price - cardDiscount, 0)

  const splitHint = teaser.in_circle
    ? `Pool with ${teaser.circle_owner_name ?? "circle"} — 50% cashback split`
    : "Not in your wallet — pool with circle for 50% split"

  return {
    id: `${product.platform}:${teaser.card_id}:${product.title.slice(0, 40)}`,
    title: product.title,
    platform: product.platform,
    productUrl: product.url,
    originalPrice: product.price,
    discountedPrice,
    cardId: teaser.card_id,
    cardBankName: teaser.bank_name,
    cardName: teaser.card_name,
    cardLabel: `${teaser.bank_name} ${teaser.card_name}`,
    cardDiscount,
    discountPercent: teaser.discount_percent,
    styleClasses: teaser.style_classes,
    inCircle: teaser.in_circle,
    circleOwnerName: teaser.circle_owner_name,
    serperBacked: teaser.serper_backed,
    splitHint,
    source: teaser.serper_backed ? "serper" : "catalog",
  }
}
