import {
  cardOffersOnStoreUrl,
  findCardOfferRule,
} from "@/lib/card-offer-terms"
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
  platform_mismatch?: boolean
  /** Circle pooling — half of cashback to you */
  your_cashback_share: number | null
  /** Circle pooling — half to card owner */
  circle_owner_share: number | null
  /** What you effectively spend after your share of cashback */
  effective_cost: number | null
  is_pooled: boolean
}

const SEO_TERM_BLOCK =
  /paisabazaar|bankbazaar|cardinsider|best credit card|apply now|click here|202[4-9]\s*list|affiliate/i

function sanitizeTerms(terms: string[]): string[] {
  return [...new Set(terms.map((t) => t.trim()))].filter(
    (t) => t.length > 0 && t.length <= 220 && !SEO_TERM_BLOCK.test(t)
  )
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

  const platformMismatch = !cardOffersOnStoreUrl({
    card_id: input.offer.card_id,
    url: input.url,
    category: input.category,
  })

  const listPrice = input.listPrice
  let discountPercent = input.offer.discount_percent || rule.basePercent
  let discountAmount = input.offer.discount_amount
  let qualifies = true
  let qualificationNote: string | undefined

  if (platformMismatch) {
    qualifies = false
    qualificationNote =
      "This card's offer applies on a different store — switch listing or use Ping 50/50."
    discountAmount = 0
    discountPercent = 0
  } else if (listPrice !== null) {
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

  const mergedTerms = sanitizeTerms([
    ...rule.terms,
    ...(input.offer.terms_and_conditions ?? []),
    ...(input.extraTerms ?? []),
  ])

  const isPooled = input.offer.source === "circle"

  if (rule.capPerTransaction && listPrice !== null && qualifies) {
    mergedTerms.push(
      `Per-transaction reward cap applied: max ₹${rule.capPerTransaction.toLocaleString("en-IN")} cashback for this spend.`
    )
  }

  if (isPooled) {
    mergedTerms.push(
      "PoolPay circle split: 50% of posted cashback to you, 50% to the card owner."
    )
  }

  const yourCashbackShare =
    isPooled && listPrice !== null && qualifies
      ? Math.round(discountAmount * POOL_SPLIT_RATIO)
      : null
  const circleOwnerShare =
    isPooled && listPrice !== null && qualifies
      ? discountAmount - (yourCashbackShare ?? 0)
      : null
  const effectiveCost =
    listPrice !== null && qualifies
      ? isPooled
        ? Math.max(listPrice - (yourCashbackShare ?? 0), 0)
        : amountToPay
      : listPrice

  return {
    list_price: listPrice,
    discount_amount: discountAmount,
    discount_percent: discountPercent,
    amount_to_pay: amountToPay,
    terms_and_conditions: mergedTerms,
    qualifies,
    qualification_note: qualificationNote,
    platform_mismatch: platformMismatch,
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
    platform_mismatch: breakdown.platform_mismatch,
    your_cashback_share: breakdown.your_cashback_share,
    circle_owner_share: breakdown.circle_owner_share,
    effective_cost: breakdown.effective_cost,
    is_pooled: breakdown.is_pooled,
    recommended: false,
  }
}

export function offerIsQualifying(offer: DealOffer | null): boolean {
  if (!offer) return false
  if (offer.qualifies === false || offer.platform_mismatch) return false
  if (offer.discount_amount <= 0) return false
  return true
}

export function pickBestQualifyingOffer(offers: DealOffer[]): DealOffer | null {
  const qualifying = offers.filter((o) => offerIsQualifying(o))
  if (qualifying.length === 0) return null

  const sorted = [...qualifying].sort((a, b) => {
    if (a.discount_amount !== b.discount_amount) {
      return b.discount_amount - a.discount_amount
    }
    if (a.discount_percent !== b.discount_percent) {
      return b.discount_percent - a.discount_percent
    }
    const aSerper = a.serper_backed ? 1 : 0
    const bSerper = b.serper_backed ? 1 : 0
    if (aSerper !== bSerper) return bSerper - aSerper
    return (a.source === "wallet" ? 1 : 0) - (b.source === "wallet" ? 1 : 0)
  })

  return sorted[0] ?? null
}

export function enrichDealSearchResult(
  result: DealSearchResult,
  url: string
): DealSearchResult {
  const offers = result.offers.map((offer) =>
    enrichDealOffer(offer, result.estimated_price, url, result.category)
  )

  const bestOffer = pickBestQualifyingOffer(offers)
  const offersWithFlags = offers.map((offer) => ({
    ...offer,
    recommended: bestOffer
      ? offer.card_id === bestOffer.card_id &&
        offer.source === bestOffer.source &&
        offer.owner_user_id === bestOffer.owner_user_id
      : false,
  }))

  const summary = buildEnrichedSummary(bestOffer, result.estimated_price, result.platform)

  return {
    ...result,
    offers: offersWithFlags,
    best_offer: bestOffer,
    summary,
  }
}

function buildEnrichedSummary(
  best: DealOffer | null,
  listPrice: number | null,
  platform: string
): string {
  if (!best) {
    if (listPrice !== null) {
      return `No wallet/circle card saves you on ${platform} at ${formatInr(listPrice)} — try Ping 50/50 or check Deals for lenders earning on their cards.`
    }
    return "No qualifying card offer on this store — try Ping 50/50 split or browse lender deals."
  }

  const label = `${best.bank_name} ${best.card_name}`

  if (listPrice === null) {
    return `${label} — est. ${best.discount_percent}% back. Add product price for exact ₹ breakdown.`
  }

  if (best.is_pooled && best.your_cashback_share != null) {
    return `${label} (circle pool): ₹${best.discount_amount.toLocaleString("en-IN")} total cashback → you keep ₹${best.your_cashback_share.toLocaleString("en-IN")} (50%). Effective cost ₹${best.effective_cost?.toLocaleString("en-IN")}.`
  }

  return `${label}: ₹${best.discount_amount.toLocaleString("en-IN")} off → pay ₹${best.amount_to_pay?.toLocaleString("en-IN")} after cashback.`
}

export function formatInr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—"
  return `₹${amount.toLocaleString("en-IN")}`
}
