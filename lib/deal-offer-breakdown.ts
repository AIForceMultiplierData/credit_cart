import { findCardOfferRule } from "@/lib/card-offer-terms"
import type {
  DealOffer,
  DealSearchCategory,
  DealSearchResult,
} from "@/lib/deal-search"

export const POOL_SPLIT_RATIO = 0.5

export type OfferBreakdown = {
  list_price: number | null
  discount_amount: number
  discount_percent: number
  amount_to_pay: number | null
  terms_and_conditions: string[]
  qualifies: boolean
  qualification_note?: string
  /** Circle pooling — half of cashback to you */
  your_cashback_share: number | null
  /** Circle pooling — half to card owner */
  circle_owner_share: number | null
  /** What you effectively spend after your share of cashback */
  effective_cost: number | null
  is_pooled: boolean
}

export function computeOfferBreakdown(input: {
  offer: Pick<
    DealOffer,
    | "card_id"
    | "source"
    | "discount_percent"
    | "discount_amount"
    | "estimated_final_price"
    | "terms_and_conditions"
  >
  listPrice: number | null
  url: string
  category: DealSearchCategory
  extraTerms?: string[]
}): OfferBreakdown {
  const rule = findCardOfferRule({
    card_id: input.offer.card_id,
    url: input.url,
    category: input.category,
  })

  const listPrice = input.listPrice
  let discountPercent = input.offer.discount_percent || rule.basePercent
  let discountAmount = input.offer.discount_amount
  let qualifies = true
  let qualificationNote: string | undefined

  if (listPrice !== null) {
    if (rule.minTransaction && listPrice < rule.minTransaction) {
      qualifies = false
      qualificationNote = `Minimum spend ₹${rule.minTransaction.toLocaleString("en-IN")} required — your estimate is lower.`
      discountAmount = 0
      discountPercent = 0
    } else {
      const rawDiscount = Math.round((listPrice * discountPercent) / 100)
      const capped = rule.capPerTransaction
        ? Math.min(rawDiscount, rule.capPerTransaction)
        : rawDiscount
      discountAmount = capped
      if (capped < rawDiscount && rule.capPerTransaction) {
        discountPercent = Math.round((capped / listPrice) * 1000) / 10
      }
    }
  }

  const amountToPay =
    listPrice !== null ? Math.max(listPrice - discountAmount, 0) : null

  const mergedTerms = [
    ...rule.terms,
    ...(input.offer.terms_and_conditions ?? []),
    ...(input.extraTerms ?? []),
  ]

  const uniqueTerms = [...new Set(mergedTerms.map((t) => t.trim()))].filter(
    Boolean
  )

  const isPooled = input.offer.source === "circle"

  if (rule.capPerTransaction && listPrice !== null && qualifies) {
    uniqueTerms.push(
      `Per-transaction reward cap applied: max ₹${rule.capPerTransaction.toLocaleString("en-IN")} cashback for this spend.`
    )
  }

  if (isPooled) {
    uniqueTerms.push(
      "PoolPay circle split: 50% of posted cashback to you, 50% to the card owner."
    )
  }

  const yourCashbackShare =
    isPooled && listPrice !== null
      ? Math.round(discountAmount * POOL_SPLIT_RATIO)
      : null
  const circleOwnerShare =
    isPooled && listPrice !== null
      ? discountAmount - (yourCashbackShare ?? 0)
      : null
  const effectiveCost =
    listPrice !== null
      ? isPooled
        ? Math.max(listPrice - (yourCashbackShare ?? 0), 0)
        : amountToPay
      : null

  return {
    list_price: listPrice,
    discount_amount: discountAmount,
    discount_percent: discountPercent,
    amount_to_pay: amountToPay,
    terms_and_conditions: uniqueTerms,
    qualifies,
    qualification_note: qualificationNote,
    your_cashback_share: yourCashbackShare,
    circle_owner_share: circleOwnerShare,
    effective_cost: effectiveCost,
    is_pooled: isPooled,
  }
}

export function enrichDealOffer(
  offer: DealOffer,
  listPrice: number | null,
  url: string,
  category: DealSearchCategory,
  extraTerms?: string[]
): DealOffer {
  const breakdown = computeOfferBreakdown({
    offer,
    listPrice,
    url,
    category,
    extraTerms,
  })

  return {
    ...offer,
    discount_percent: breakdown.discount_percent,
    discount_amount: breakdown.discount_amount,
    estimated_final_price: breakdown.amount_to_pay,
    list_price: breakdown.list_price,
    amount_to_pay: breakdown.amount_to_pay,
    terms_and_conditions: breakdown.terms_and_conditions,
    qualifies: breakdown.qualifies,
    qualification_note: breakdown.qualification_note,
    your_cashback_share: breakdown.your_cashback_share,
    circle_owner_share: breakdown.circle_owner_share,
    effective_cost: breakdown.effective_cost,
    is_pooled: breakdown.is_pooled,
  }
}

export function enrichDealSearchResult(
  result: DealSearchResult,
  url: string
): DealSearchResult {
  const serperTerms = result.market_offers
    .slice(0, 2)
    .map((row) => `${row.title}: ${row.snippet}`.slice(0, 200))

  const offers = result.offers.map((offer) =>
    enrichDealOffer(
      offer,
      result.estimated_price,
      url,
      result.category,
      offer.serper_backed ? serperTerms : undefined
    )
  )

  const bestOffer =
    offers.find((offer) => offer.recommended) ?? offers[0] ?? null

  const summary = buildEnrichedSummary(bestOffer, result.estimated_price)

  return {
    ...result,
    offers,
    best_offer: bestOffer,
    summary,
  }
}

function buildEnrichedSummary(
  best: DealOffer | null,
  listPrice: number | null
): string {
  if (!best) return "Add cards to your wallet to compare offers."

  const label = `${best.bank_name} ${best.card_name}`

  if (listPrice === null) {
    return `${label} — est. ${best.discount_percent}% back. Add product price for exact ₹ breakdown.`
  }

  if (best.is_pooled && best.your_cashback_share != null) {
    return `${label} (circle pool): ₹${best.discount_amount.toLocaleString("en-IN")} total cashback → you keep ₹${best.your_cashback_share.toLocaleString("en-IN")} (50%). Effective cost ₹${best.effective_cost?.toLocaleString("en-IN")}.`
  }

  return `${label}: ₹${best.discount_amount.toLocaleString("en-IN")} off → pay ₹${best.amount_to_pay?.toLocaleString("en-IN")} (100% cashback yours).`
}

export function formatInr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—"
  return `₹${amount.toLocaleString("en-IN")}`
}
