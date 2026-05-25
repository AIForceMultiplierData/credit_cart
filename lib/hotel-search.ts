export type HotelSort = "best_card" | "cheapest" | "rating"

export type HotelGuests = {
  adults: number
  children: number
}

export type HotelFilters = {
  hideNonRefundable: boolean
  minStars: number
  chains: string[]
  maxPrice: number | null
}

export type HotelSearchParams = {
  city: string
  cityCode: string
  checkIn: string
  checkOut: string
  rooms: number
  guests: HotelGuests
  estimatedTotal: number | null
  selectedListingId: string | null
  filters: HotelFilters
  sort: HotelSort
}

export const HOTEL_SORT_OPTIONS: Array<{ id: HotelSort; label: string }> = [
  { id: "best_card", label: "Best card value" },
  { id: "cheapest", label: "Cheapest stay" },
  { id: "rating", label: "Highest rated" },
]

export const HOTEL_CHAIN_OPTIONS = [
  { id: "oyo", label: "OYO" },
  { id: "treebo", label: "Treebo" },
  { id: "lemon", label: "Lemon Tree" },
  { id: "itc", label: "ITC" },
  { id: "taj", label: "Taj" },
  { id: "marriott", label: "Marriott" },
]

export const INDIAN_HOTEL_CITIES = [
  { code: "DEL", city: "New Delhi", label: "New Delhi" },
  { code: "BOM", city: "Mumbai", label: "Mumbai" },
  { code: "BLR", city: "Bengaluru", label: "Bengaluru" },
  { code: "HYD", city: "Hyderabad", label: "Hyderabad" },
  { code: "MAA", city: "Chennai", label: "Chennai" },
  { code: "GOI", city: "Goa", label: "Goa" },
  { code: "JAI", city: "Jaipur", label: "Jaipur" },
  { code: "UDR", city: "Udaipur", label: "Udaipur" },
  { code: "COK", city: "Kochi", label: "Kochi" },
  { code: "PNQ", city: "Pune", label: "Pune" },
]

export function defaultHotelSearchParams(): HotelSearchParams {
  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + 14)
  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + 2)

  return {
    city: "Goa",
    cityCode: "GOI",
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
    rooms: 1,
    guests: { adults: 2, children: 0 },
    estimatedTotal: null,
    selectedListingId: null,
    filters: { hideNonRefundable: true, minStars: 0, chains: [], maxPrice: null },
    sort: "best_card",
  }
}

export function formatHotelDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
  })
}

export function guestSummary(g: HotelGuests, rooms: number): string {
  const total = g.adults + g.children
  return `${rooms} Room${rooms === 1 ? "" : "s"}, ${total} Guest${total === 1 ? "" : "s"}`
}

export function buildHotelProductTitle(params: HotelSearchParams): string {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(`${params.checkOut}T12:00:00`).getTime() -
        new Date(`${params.checkIn}T12:00:00`).getTime()) /
        86400000
    )
  )
  return `${params.city} · ${formatHotelDate(params.checkIn)} – ${formatHotelDate(params.checkOut)} (${nights}N)`
}

export function buildHotelSerperQuery(params: HotelSearchParams): string {
  return [
    `hotels ${params.city} India`,
    params.checkIn,
    params.checkOut,
    `${params.rooms} room`,
    "booking price INR credit card offer MakeMyTrip Booking.com OYO",
  ].join(" ")
}

export function buildHotelReferenceUrl(params: HotelSearchParams): string {
  const q = [
    "Hotels",
    params.city,
    params.checkIn.replace(/-/g, ""),
    params.checkOut.replace(/-/g, ""),
  ]
  return `https://www.google.com/travel/hotels?q=${encodeURIComponent(q.join(" "))}`
}

export function validateHotelSearch(
  params: HotelSearchParams,
  options?: { requirePrice?: boolean }
): { ok: true } | { ok: false; message: string } {
  if (!params.cityCode.trim()) {
    return { ok: false, message: "Select a destination city." }
  }
  if (!params.checkIn) {
    return { ok: false, message: "Select check-in date." }
  }
  if (!params.checkOut) {
    return { ok: false, message: "Select check-out date." }
  }
  if (params.checkOut <= params.checkIn) {
    return { ok: false, message: "Check-out must be after check-in." }
  }
  if (params.guests.adults < 1) {
    return { ok: false, message: "At least one adult guest is required." }
  }
  if (params.rooms < 1) {
    return { ok: false, message: "At least one room is required." }
  }
  const requirePrice = options?.requirePrice !== false
  if (
    requirePrice &&
    !params.selectedListingId &&
    (params.estimatedTotal === null || params.estimatedTotal <= 0)
  ) {
    return {
      ok: false,
      message:
        "Pick a hotel below or enter total stay price (₹) from the booking page.",
    }
  }
  return { ok: true }
}

export function parseHotelSearchBody(raw: unknown): HotelSearchParams | null {
  if (typeof raw !== "object" || raw === null) return null
  const b = raw as Record<string, unknown>
  const guestsRaw =
    typeof b.guests === "object" && b.guests !== null
      ? (b.guests as Record<string, unknown>)
      : {}
  const filtersRaw =
    typeof b.filters === "object" && b.filters !== null
      ? (b.filters as Record<string, unknown>)
      : {}

  const total = Number(b.estimatedTotal)
  const maxPrice = Number(filtersRaw.maxPrice)

  return {
    city: String(b.city ?? ""),
    cityCode: String(b.cityCode ?? "").toUpperCase(),
    checkIn: String(b.checkIn ?? ""),
    checkOut: String(b.checkOut ?? ""),
    rooms: Math.max(1, Number(b.rooms) || 1),
    guests: {
      adults: Math.max(1, Number(guestsRaw.adults) || 1),
      children: Math.max(0, Number(guestsRaw.children) || 0),
    },
    estimatedTotal:
      Number.isFinite(total) && total > 0 ? Math.round(total) : null,
    selectedListingId:
      typeof b.selectedListingId === "string" ? b.selectedListingId : null,
    filters: {
      hideNonRefundable: filtersRaw.hideNonRefundable !== false,
      minStars: Math.max(0, Number(filtersRaw.minStars) || 0),
      chains: Array.isArray(filtersRaw.chains)
        ? filtersRaw.chains.filter((c): c is string => typeof c === "string")
        : [],
      maxPrice:
        Number.isFinite(maxPrice) && maxPrice > 0 ? Math.round(maxPrice) : null,
    },
    sort: (HOTEL_SORT_OPTIONS.some((s) => s.id === b.sort)
      ? b.sort
      : "best_card") as HotelSort,
  }
}
