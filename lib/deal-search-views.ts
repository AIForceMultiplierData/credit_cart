import type {
  DealOffer,
  DealSearchCategory,
  DealSearchResult,
  TravelListing,
} from "@/lib/deal-search"
import { offerIsQualifying } from "@/lib/deal-offer-breakdown"

export type CardOfferStatus =
  | "qualifying"
  | "platform_mismatch"
  | "min_spend"
  | "no_discount"
  | "unknown"

export type CardOfferView = {
  card_id: string
  bank_name: string
  card_name: string
  source: "wallet" | "circle"
  owner_name?: string
  status: CardOfferStatus
  status_label: string
  discount_amount: number
  discount_percent: number
  effective_cost: number | null
  recommended: boolean
}

export type DealSearchViews = {
  category: DealSearchCategory
  has_qualifying_card: boolean
  show_ping_split: boolean
  show_lender_deals: boolean
  show_best_card_panel: boolean
  price_for_cards: number | null
  platform: string
  qualifying_count: number
  cards: CardOfferView[]
}

export type DealSearchRawSnapshot = {
  listings_all: TravelListing[]
  serper_queries: string[]
  captured_at: string
}

function classifyOffer(offer: DealOffer): {
  status: CardOfferStatus
  status_label: string
} {
  if (offerIsQualifying(offer)) {
    return { status: "qualifying", status_label: "Qualifies on this store" }
  }
  if (offer.platform_mismatch) {
    return {
      status: "platform_mismatch",
      status_label: "Card offer is for a different store",
    }
  }
  if (offer.qualifies === false && offer.qualification_note) {
    return {
      status: "min_spend",
      status_label: offer.qualification_note,
    }
  }
  if (offer.discount_amount <= 0) {
    return {
      status: "no_discount",
      status_label: "No discount at this price on this store",
    }
  }
  return { status: "unknown", status_label: "Does not qualify" }
}

function offerToCardView(offer: DealOffer): CardOfferView {
  const { status, status_label } = classifyOffer(offer)
  return {
    card_id: offer.card_id,
    bank_name: offer.bank_name,
    card_name: offer.card_name,
    source: offer.source,
    owner_name: offer.owner_name,
    status,
    status_label,
    discount_amount: offer.discount_amount,
    discount_percent: offer.discount_percent,
    effective_cost: offer.effective_cost ?? offer.amount_to_pay ?? null,
    recommended: offer.recommended ?? false,
  }
}

/** Prepare all UI views for Home search + Deals window from one enriched result */
export function prepareDealSearchViews(
  result: DealSearchResult
): DealSearchViews {
  const cards = result.offers.map(offerToCardView)
  const qualifying_count = cards.filter((c) => c.status === "qualifying").length
  const has_qualifying_card =
    qualifying_count > 0 || offerIsQualifying(result.best_offer)

  return {
    category: result.category,
    has_qualifying_card,
    show_ping_split: !has_qualifying_card,
    show_lender_deals: !has_qualifying_card,
    show_best_card_panel: has_qualifying_card,
    price_for_cards: result.estimated_price,
    platform: result.platform,
    qualifying_count,
    cards,
  }
}

export function attachDealSearchViews(
  result: DealSearchResult,
  raw?: Omit<DealSearchRawSnapshot, "captured_at">
): DealSearchResult {
  const views = prepareDealSearchViews(result)
  const raw_snapshot: DealSearchRawSnapshot | undefined = raw
    ? {
        listings_all: raw.listings_all,
        serper_queries: raw.serper_queries,
        captured_at: new Date().toISOString(),
      }
    : result.raw_snapshot

  return {
    ...result,
    views,
    raw_snapshot,
  }
}
