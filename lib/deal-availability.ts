import type { SearchCardInput } from "@/lib/deal-search"
import { cardsReferToSameCard, isCardInWallet } from "@/lib/card-identity"

export type DealAvailability = "wallet" | "circle" | "ping_to_split"

/** Lower = higher priority on Live Deals feed */
export const DEAL_AVAILABILITY_SORT: Record<DealAvailability, number> = {
  ping_to_split: 0,
  circle: 1,
  wallet: 2,
}

export const DEAL_AVAILABILITY_META: Record<
  DealAvailability,
  { label: string; hint: string; badgeClass: string }
> = {
  ping_to_split: {
    label: "Ping to split",
    hint: "Not in wallet or circle — ping for 50/50 pool cashback",
    badgeClass:
      "border-violet-500/35 bg-violet-500/15 text-violet-200",
  },
  circle: {
    label: "Circle",
    hint: "A circle member has this card — pool for 50/50 split",
    badgeClass: "border-blue-500/35 bg-blue-500/15 text-blue-200",
  },
  wallet: {
    label: "Wallet",
    hint: "You own this card — use it and keep 100% cashback",
    badgeClass: "border-emerald-500/35 bg-emerald-500/15 text-emerald-200",
  },
}

export function resolveDealAvailability(
  catalog: { card_id: string; bank_name: string; card_name: string },
  searchCards: SearchCardInput[]
): { availability: DealAvailability; circleOwnerName?: string } {
  const walletCards = searchCards.filter((c) => c.source === "wallet")

  if (isCardInWallet(catalog, walletCards)) {
    return { availability: "wallet" }
  }

  for (const card of searchCards) {
    if (card.source === "circle" && cardsReferToSameCard(catalog, card)) {
      return {
        availability: "circle",
        circleOwnerName: card.owner_name ?? "Circle friend",
      }
    }
  }

  return { availability: "ping_to_split" }
}

export function compareDealsByAvailability<
  T extends { availability: DealAvailability; cardDiscount: number },
>(a: T, b: T): number {
  const order =
    DEAL_AVAILABILITY_SORT[a.availability] -
    DEAL_AVAILABILITY_SORT[b.availability]
  if (order !== 0) return order
  return b.cardDiscount - a.cardDiscount
}
