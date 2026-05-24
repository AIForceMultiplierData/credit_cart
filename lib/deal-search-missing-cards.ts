import { CARD_CATALOG } from "@/lib/card-catalog"
import { cardsReferToSameCard, isCardInWallet } from "@/lib/card-identity"
import {
  detectPlatform,
  type DealOffer,
  type MissingCardTeaser,
  type SearchCardInput,
} from "@/lib/deal-search"
import {
  extractSerperPercentForCard,
  isSerperBackedForCard,
} from "@/lib/deal-search-ranking"
import type { SerperDealContext } from "@/lib/serper-client"

const PLATFORM_CARD_SCORES: Array<{
  urlPattern: RegExp
  cardId: string
  discountPercent: number
  reason: string
}> = [
  {
    urlPattern: /amazon\.(in|com)/i,
    cardId: "icici_amazon",
    discountPercent: 5,
    reason: "Built for 5% on Amazon India spends.",
  },
  {
    urlPattern: /amazon\.(in|com)/i,
    cardId: "hdfc_millennia",
    discountPercent: 5,
    reason: "HDFC Millennia often stacks 5% on Amazon.",
  },
  {
    urlPattern: /flipkart\.com/i,
    cardId: "axis_flipkart",
    discountPercent: 5,
    reason: "Axis Flipkart card is made for unlimited Flipkart cashback.",
  },
  {
    urlPattern: /makemytrip|goibibo|cleartrip|ixigo|yatra|booking\.com|oyo/i,
    cardId: "hdfc_regalia",
    discountPercent: 10,
    reason: "Premium travel rewards on OTAs and hotels.",
  },
  {
    urlPattern: /makemytrip|goibibo|cleartrip|ixigo|yatra|booking\.com|oyo/i,
    cardId: "axis_magnus",
    discountPercent: 10,
    reason: "Strong travel lounge + accelerated OTA rewards.",
  },
  {
    urlPattern: /makemytrip|goibibo|cleartrip|ixigo|yatra/i,
    cardId: "hdfc_diners",
    discountPercent: 10,
    reason: "Diners Black tier unlocks premium travel perks.",
  },
]

function catalogAsSearchCard(
  card: (typeof CARD_CATALOG)[number]
): SearchCardInput {
  return {
    card_id: card.card_id,
    bank_name: card.bank_name,
    card_name: card.card_name,
    source: "wallet",
  }
}

function platformScoreForCard(
  url: string,
  cardId: string
): { discountPercent: number; reason: string } | null {
  for (const row of PLATFORM_CARD_SCORES) {
    if (row.urlPattern.test(url) && row.cardId === cardId) {
      return {
        discountPercent: row.discountPercent,
        reason: row.reason,
      }
    }
  }
  return null
}

function bestWalletOffer(offers: DealOffer[]): DealOffer | null {
  const walletOffers = offers.filter((o) => o.source === "wallet")
  if (walletOffers.length === 0) return null
  return walletOffers.reduce((best, current) =>
    current.discount_amount > best.discount_amount ? current : best
  )
}

export function buildMissingCardTeasers(input: {
  url: string
  estimatedPrice: number | null
  searchCards: SearchCardInput[]
  offers: DealOffer[]
  serper: SerperDealContext
  limit?: number
}): MissingCardTeaser[] {
  const { url, estimatedPrice, searchCards, offers, serper } = input
  const limit = input.limit ?? 4
  const platform = detectPlatform(url)

  const walletCards = searchCards.filter((c) => c.source === "wallet")

  const circleByCardId = new Map<string, string>()
  for (const card of searchCards) {
    if (card.source === "circle" && !circleByCardId.has(card.card_id)) {
      circleByCardId.set(card.card_id, card.owner_name ?? "Circle friend")
    }
  }

  const walletBest = bestWalletOffer(offers)
  const walletBestAmount = walletBest?.discount_amount ?? 0

  const candidates: MissingCardTeaser[] = []

  for (const catalog of CARD_CATALOG) {
    if (isCardInWallet(catalog, walletCards)) continue

    const pseudo = catalogAsSearchCard(catalog)
    const platformHit = platformScoreForCard(url, catalog.card_id)
    const serperPercent = extractSerperPercentForCard(serper, pseudo)
    const serperBacked = isSerperBackedForCard(serper, pseudo)

    let discountPercent =
      Math.max(platformHit?.discountPercent ?? 0, serperPercent ?? 0)

    if (discountPercent <= 0 && serperBacked) {
      discountPercent = 3
    }

    if (discountPercent <= 0) continue

    const discountAmount =
      estimatedPrice !== null
        ? Math.round((estimatedPrice * discountPercent) / 100)
        : 0

    if (walletBest && cardsReferToSameCard(catalog, walletBest)) {
      continue
    }

    if (estimatedPrice !== null && discountAmount <= walletBestAmount) {
      continue
    }

    const inCircle = circleByCardId.has(catalog.card_id)
    const circleOwner = circleByCardId.get(catalog.card_id)

    let reason =
      platformHit?.reason ??
      (serperBacked
        ? `Live web offers cite ~${discountPercent}% for ${platform}.`
        : `Strong match for ${platform} purchases.`)

    if (inCircle && circleOwner) {
      reason = `${circleOwner} pools this in your circle — get your own & keep 100% cashback.`
    }

    candidates.push({
      card_id: catalog.card_id,
      bank_name: catalog.bank_name,
      card_name: catalog.card_name,
      style_classes: catalog.style_classes,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      reason,
      in_circle: inCircle,
      circle_owner_name: circleOwner,
      serper_backed: serperBacked,
      apply_url: catalog.apply_url,
    })
  }

  candidates.sort((a, b) => {
    if (a.discount_amount !== b.discount_amount) {
      return b.discount_amount - a.discount_amount
    }
    if (a.discount_percent !== b.discount_percent) {
      return b.discount_percent - a.discount_percent
    }
    const aSerper = a.serper_backed ? 1 : 0
    const bSerper = b.serper_backed ? 1 : 0
    if (aSerper !== bSerper) return bSerper - aSerper
    const aCircle = a.in_circle ? 1 : 0
    const bCircle = b.in_circle ? 1 : 0
    return bCircle - aCircle
  })

  return candidates.slice(0, limit)
}
