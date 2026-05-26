import type { DealAvailability } from "@/lib/deal-availability"

export const DEALS_TAB_FILTER_KEY = "poolpay_deals_tab_filter"

export function setDealsTabFilter(filter: DealAvailability) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(DEALS_TAB_FILTER_KEY, filter)
}

export function consumeDealsTabFilter(): DealAvailability | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(DEALS_TAB_FILTER_KEY)
  sessionStorage.removeItem(DEALS_TAB_FILTER_KEY)
  if (raw === "ping_to_split" || raw === "circle" || raw === "wallet") {
    return raw
  }
  return null
}
