import { FALLBACK_AIRPORT_OPTIONS } from "@/lib/indian-airports"

export type FlightTripType = "oneway" | "return"

export type FlightTimeSlot =
  | "any"
  | "early_morning"
  | "morning"
  | "afternoon"
  | "evening"

export type FlightCabinClass =
  | "economy"
  | "premium_economy"
  | "business"

export type FlightSort = "best_card" | "cheapest" | "fastest" | "shortest"

export type FlightPassengers = {
  adults: number
  children: number
  infants: number
}

export type FlightFilters = {
  hideNonRefundable: boolean
  airlines: string[]
  maxPrice: number | null
}

export type FlightSearchParams = {
  tripType: FlightTripType
  origin: string
  originCode: string
  destination: string
  destinationCode: string
  departDate: string
  returnDate: string | null
  timeSlot: FlightTimeSlot
  passengers: FlightPassengers
  cabinClass: FlightCabinClass
  estimatedFare: number | null
  selectedListingId: string | null
  filters: FlightFilters
  sort: FlightSort
}

export const FLIGHT_TIME_SLOTS: Array<{
  id: FlightTimeSlot
  label: string
  hint: string
}> = [
  { id: "any", label: "Any time", hint: "All departures" },
  { id: "early_morning", label: "Early", hint: "00:00 – 06:00" },
  { id: "morning", label: "Morning", hint: "06:00 – 12:00" },
  { id: "afternoon", label: "Afternoon", hint: "12:00 – 18:00" },
  { id: "evening", label: "Evening", hint: "18:00 – 24:00" },
]

export const FLIGHT_CABIN_OPTIONS: Array<{
  id: FlightCabinClass
  label: string
}> = [
  { id: "economy", label: "Economy / Premium Economy" },
  { id: "premium_economy", label: "Premium Economy" },
  { id: "business", label: "Business" },
]

export const FLIGHT_SORT_OPTIONS: Array<{ id: FlightSort; label: string }> = [
  { id: "best_card", label: "Best card value" },
  { id: "cheapest", label: "Cheapest fare" },
  { id: "fastest", label: "Fastest" },
  { id: "shortest", label: "Shortest duration" },
]

export const FLIGHT_AIRLINE_OPTIONS = [
  { id: "indigo", label: "IndiGo", from: 4200 },
  { id: "air_india", label: "Air India", from: 8641 },
  { id: "air_india_express", label: "Air India Express", from: 11933 },
  { id: "akasa", label: "Akasa Air", from: 10286 },
  { id: "spicejet", label: "SpiceJet", from: 5500 },
  { id: "vistara", label: "Vistara", from: 9200 },
]

/** Legacy export — prefer Supabase `indian_airports` via useIndianAirports */
export const INDIAN_AIRPORTS = FALLBACK_AIRPORT_OPTIONS.map((a) => ({
  code: a.code,
  city: a.city,
  label: a.label,
}))

export function defaultFlightSearchParams(): FlightSearchParams {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 7)
  const depart = tomorrow.toISOString().slice(0, 10)

  return {
    tripType: "oneway",
    origin: "New Delhi",
    originCode: "DEL",
    destination: "Bengaluru",
    destinationCode: "BLR",
    departDate: depart,
    returnDate: null,
    timeSlot: "any",
    passengers: { adults: 1, children: 0, infants: 0 },
    cabinClass: "economy",
    estimatedFare: null,
    selectedListingId: null,
    filters: { hideNonRefundable: true, airlines: [], maxPrice: null },
    sort: "best_card",
  }
}

export function formatFlightDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
  })
}

export function passengerSummary(p: FlightPassengers, cabin: FlightCabinClass): string {
  const total = p.adults + p.children + p.infants
  const cabinLabel =
    FLIGHT_CABIN_OPTIONS.find((c) => c.id === cabin)?.label ?? "Economy"
  return `${total} Traveller${total === 1 ? "" : "s"}, ${cabinLabel}`
}

export function buildFlightProductTitle(params: FlightSearchParams): string {
  const route = `${params.originCode} → ${params.destinationCode}`
  const depart = formatFlightDate(params.departDate)
  if (params.tripType === "return" && params.returnDate) {
    return `${route} · ${depart} – ${formatFlightDate(params.returnDate)}`
  }
  return `${route} · ${depart}`
}

export function buildFlightSerperQuery(params: FlightSearchParams): string {
  const pax =
    params.passengers.adults +
    params.passengers.children +
    params.passengers.infants
  const dates =
    params.tripType === "return" && params.returnDate
      ? `${params.departDate} to ${params.returnDate}`
      : params.departDate

  return [
    `flights ${params.originCode} to ${params.destinationCode}`,
    dates,
    params.cabinClass,
    `${pax} passenger`,
    "India price INR credit card offer MakeMyTrip Cleartrip",
  ].join(" ")
}

export function buildFlightReferenceUrl(params: FlightSearchParams): string {
  const q = [
    "Flights",
    `${params.originCode}`,
    `to`,
    `${params.destinationCode}`,
    `on`,
    params.departDate.replace(/-/g, ""),
  ]
  if (params.tripType === "return" && params.returnDate) {
    q.push("return", params.returnDate.replace(/-/g, ""))
  }
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q.join(" "))}`
}

export function validateFlightSearch(
  params: FlightSearchParams,
  options?: { requirePrice?: boolean }
): { ok: true } | { ok: false; message: string } {
  if (!params.originCode.trim() || !params.destinationCode.trim()) {
    return { ok: false, message: "Select origin and destination airports." }
  }
  if (params.originCode === params.destinationCode) {
    return { ok: false, message: "Origin and destination must be different." }
  }
  if (!params.departDate) {
    return { ok: false, message: "Select a departure date." }
  }
  if (params.tripType === "return" && !params.returnDate) {
    return { ok: false, message: "Select a return date for round trip." }
  }
  if (
    params.tripType === "return" &&
    params.returnDate &&
    params.returnDate < params.departDate
  ) {
    return { ok: false, message: "Return date must be on or after departure." }
  }
  const requirePrice = options?.requirePrice !== false
  if (
    requirePrice &&
    !params.selectedListingId &&
    (params.estimatedFare === null || params.estimatedFare <= 0)
  ) {
    return {
      ok: false,
      message:
        "Pick a flight below or enter total fare (₹) from the booking page.",
    }
  }
  if (params.passengers.adults < 1) {
    return { ok: false, message: "At least one adult traveller is required." }
  }
  return { ok: true }
}

export function parseFlightSearchBody(raw: unknown): FlightSearchParams | null {
  if (typeof raw !== "object" || raw === null) return null
  const b = raw as Record<string, unknown>
  const tripType = b.tripType === "return" ? "return" : "oneway"
  const passengersRaw =
    typeof b.passengers === "object" && b.passengers !== null
      ? (b.passengers as Record<string, unknown>)
      : {}

  const filtersRaw =
    typeof b.filters === "object" && b.filters !== null
      ? (b.filters as Record<string, unknown>)
      : {}

  const fare = Number(b.estimatedFare)
  const maxPrice = Number(filtersRaw.maxPrice)

  return {
    tripType,
    origin: String(b.origin ?? ""),
    originCode: String(b.originCode ?? "").toUpperCase(),
    destination: String(b.destination ?? ""),
    destinationCode: String(b.destinationCode ?? "").toUpperCase(),
    departDate: String(b.departDate ?? ""),
    returnDate:
      tripType === "return" && b.returnDate
        ? String(b.returnDate)
        : null,
    timeSlot: (FLIGHT_TIME_SLOTS.some((t) => t.id === b.timeSlot)
      ? b.timeSlot
      : "any") as FlightTimeSlot,
    passengers: {
      adults: Math.max(1, Number(passengersRaw.adults) || 1),
      children: Math.max(0, Number(passengersRaw.children) || 0),
      infants: Math.max(0, Number(passengersRaw.infants) || 0),
    },
    cabinClass: (FLIGHT_CABIN_OPTIONS.some((c) => c.id === b.cabinClass)
      ? b.cabinClass
      : "economy") as FlightCabinClass,
    estimatedFare: Number.isFinite(fare) && fare > 0 ? Math.round(fare) : null,
    selectedListingId:
      typeof b.selectedListingId === "string" ? b.selectedListingId : null,
    filters: {
      hideNonRefundable: filtersRaw.hideNonRefundable !== false,
      airlines: Array.isArray(filtersRaw.airlines)
        ? filtersRaw.airlines.filter((a): a is string => typeof a === "string")
        : [],
      maxPrice:
        Number.isFinite(maxPrice) && maxPrice > 0 ? Math.round(maxPrice) : null,
    },
    sort: (FLIGHT_SORT_OPTIONS.some((s) => s.id === b.sort)
      ? b.sort
      : "best_card") as FlightSort,
  }
}
