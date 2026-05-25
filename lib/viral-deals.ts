import type { DealAvailability } from "@/lib/deal-availability"
import type { CatalogOfferRow } from "@/lib/deal-search-missing-cards"
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
  bankLogoUrl?: string | null
  cardLabel: string
  cardDiscount: number
  discountPercent: number
  styleClasses: string
  availability: DealAvailability
  inCircle: boolean
  circleOwnerName?: string
  serperBacked: boolean
  splitHint: string
  reason: string
  source: "serper" | "catalog"
}

export type ViralDealsResult = {
  deals: ViralDeal[]
  used_serper: boolean
  wallet_excluded_count: number
  circle_count?: number
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
  {
    platform: "MakeMyTrip",
    query: "makemytrip hotel deals India trending 2026",
    fallbackUrl: "https://www.makemytrip.com/hotels/",
  },
  {
    platform: "Booking.com",
    query: "booking.com hotel offers India credit card",
    fallbackUrl: "https://www.booking.com",
  },
]

function splitHintForAvailability(
  availability: DealAvailability,
  circleOwnerName?: string
): string {
  if (availability === "wallet") {
    return "In your wallet — pay with this card and keep 100% cashback."
  }
  if (availability === "circle") {
    return `In circle (${circleOwnerName ?? "friend"}) — pool purchase for 50/50 split.`
  }
  return "Ping to split — co-purchase with circle for 50/50 cashback."
}

export function catalogOfferToViralDeal(
  product: {
    title: string
    platform: string
    url?: string
    price: number
  },
  offer: CatalogOfferRow | (MissingCardTeaser & { availability?: DealAvailability })
): ViralDeal {
  const availability =
    "availability" in offer && offer.availability
      ? offer.availability
      : offer.in_circle
        ? "circle"
        : "ping_to_split"

  const cardDiscount = offer.discount_amount
  const discountedPrice = Math.max(product.price - cardDiscount, 0)

  return {
    id: `${product.platform}:${offer.card_id}:${product.title.slice(0, 36)}`,
    title: product.title,
    platform: product.platform,
    productUrl: product.url,
    originalPrice: product.price,
    discountedPrice,
    cardId: offer.card_id,
    cardBankName: offer.bank_name,
    cardName: offer.card_name,
    bankLogoUrl: offer.bank_logo_url,
    cardLabel: `${offer.bank_name} ${offer.card_name}`,
    cardDiscount,
    discountPercent: offer.discount_percent,
    styleClasses: offer.style_classes,
    availability,
    inCircle: availability === "circle",
    circleOwnerName: offer.circle_owner_name,
    serperBacked: offer.serper_backed,
    splitHint: splitHintForAvailability(availability, offer.circle_owner_name),
    reason: offer.reason,
    source: offer.serper_backed ? "serper" : "catalog",
  }
}

export function missingTeaserToViralDeal(
  product: {
    title: string
    platform: string
    url?: string
    price: number
  },
  teaser: MissingCardTeaser
): ViralDeal {
  return catalogOfferToViralDeal(product, {
    ...teaser,
    availability: teaser.in_circle ? "circle" : "ping_to_split",
  })
}

/** Curated products so Live Deals is never empty when Serper is down. */
export const CURATED_LIVE_PRODUCTS: Array<{
  title: string
  platform: string
  url: string
  price: number
}> = [
  {
    title: "Apple AirPods Pro",
    platform: "Amazon",
    url: "https://www.amazon.in",
    price: 24900,
  },
  {
    title: "Samsung Galaxy Buds FE",
    platform: "Amazon",
    url: "https://www.amazon.in",
    price: 8999,
  },
  {
    title: "Noise ColorFit Smartwatch",
    platform: "Flipkart",
    url: "https://www.flipkart.com",
    price: 3499,
  },
  {
    title: "boAt Airdopes 300",
    platform: "Flipkart",
    url: "https://www.flipkart.com",
    price: 2499,
  },
  {
    title: "Kindle Paperwhite",
    platform: "Amazon",
    url: "https://www.amazon.in",
    price: 13999,
  },
  {
    title: "Goa weekend hotel stay",
    platform: "MakeMyTrip",
    url: "https://www.makemytrip.com/hotels/",
    price: 12499,
  },
  {
    title: "Bengaluru business hotel",
    platform: "Booking.com",
    url: "https://www.booking.com",
    price: 8999,
  },
  {
    title: "Wireless earbuds import pick",
    platform: "eBay",
    url: "https://www.ebay.com",
    price: 5999,
  },
]