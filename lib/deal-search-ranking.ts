import type { SerperDealContext } from "@/lib/serper-client"
import type { DealOffer, SearchCardInput } from "@/lib/deal-search"

const SERPER_BACKED_BONUS = 50_000
const WALLET_PRIORITY_BONUS = 500

function cardLabel(card: SearchCardInput): string {
  return `${card.bank_name} ${card.card_name}`.toLowerCase()
}

function textMentionsCard(text: string, card: SearchCardInput): boolean {
  const haystack = text.toLowerCase()
  const bank = card.bank_name.toLowerCase()
  const name = card.card_name.toLowerCase()
  return (
    (bank.length > 2 && haystack.includes(bank)) ||
    (name.length > 2 && haystack.includes(name)) ||
    haystack.includes(cardLabel(card))
  )
}

export function isSerperBackedForCard(
  serper: SerperDealContext,
  card: SearchCardInput
): boolean {
  if (!serper.used_serper) return false

  return serper.card_offer_snippets.some(
    (row) =>
      textMentionsCard(`${row.title} ${row.snippet}`, card) ||
      textMentionsCard(row.title, card)
  )
}

export function extractSerperPercentForCard(
  serper: SerperDealContext,
  card: SearchCardInput
): number | null {
  if (!serper.used_serper) return null

  let best: number | null = null

  for (const row of serper.card_offer_snippets) {
    if (!textMentionsCard(`${row.title} ${row.snippet}`, card)) continue

    const matches = `${row.title} ${row.snippet}`.match(/(\d+(?:\.\d+)?)\s*%/g)
    if (!matches) continue

    for (const match of matches) {
      const parsed = Number(match.replace("%", "").trim())
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 100) {
        best = best === null ? parsed : Math.max(best, parsed)
      }
    }
  }

  return best
}

export function rankScoreForOffer(
  offer: DealOffer,
  estimatedPrice: number | null,
  serperBacked: boolean,
  source: "wallet" | "circle"
): number {
  const rupeeSaved =
    estimatedPrice !== null
      ? offer.discount_amount
      : offer.discount_percent * 100

  let score = rupeeSaved * 100

  if (serperBacked) {
    score += SERPER_BACKED_BONUS
  }

  if (source === "wallet") {
    score += WALLET_PRIORITY_BONUS
  }

  return score
}

export function applySerperOverrides(
  offer: DealOffer,
  card: SearchCardInput,
  serper: SerperDealContext,
  estimatedPrice: number | null
): DealOffer {
  const serperPercent = extractSerperPercentForCard(serper, card)
  const serperBacked = isSerperBackedForCard(serper, card)

  let discountPercent = offer.discount_percent
  let reason = offer.reason

  if (serperPercent !== null) {
    discountPercent = Math.max(discountPercent, serperPercent)
    if (serperBacked) {
      reason = `${reason} (Serper live: ~${serperPercent}% cited for ${card.bank_name} ${card.card_name})`
    }
  } else if (serperBacked) {
    reason = `${reason} (Backed by live web offer snippets)`
  }

  const discountAmount =
    estimatedPrice !== null
      ? Math.round((estimatedPrice * discountPercent) / 100)
      : offer.discount_amount

  return {
    ...offer,
    discount_percent: discountPercent,
    discount_amount: discountAmount,
    estimated_final_price:
      estimatedPrice !== null
        ? Math.max(estimatedPrice - discountAmount, 0)
        : offer.estimated_final_price,
    reason,
    serper_backed: serperBacked,
  }
}

export function sortOffersStrict(
  offers: DealOffer[],
  estimatedPrice: number | null
): DealOffer[] {
  const sorted = [...offers].sort((a, b) => {
    if (estimatedPrice !== null && a.discount_amount !== b.discount_amount) {
      return b.discount_amount - a.discount_amount
    }

    if (a.discount_percent !== b.discount_percent) {
      return b.discount_percent - a.discount_percent
    }

    const aSerper = a.serper_backed ? 1 : 0
    const bSerper = b.serper_backed ? 1 : 0
    if (aSerper !== bSerper) return bSerper - aSerper

    const aWallet = a.source === "wallet" ? 1 : 0
    const bWallet = b.source === "wallet" ? 1 : 0
    return bWallet - aWallet
  })

  return sorted.map((offer, index) => ({
    ...offer,
    recommended: index === 0,
  }))
}
