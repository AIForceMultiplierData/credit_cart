import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"
import { FALLBACK_AIRPORT_OPTIONS } from "@/lib/indian-airports"

const INDIAN_AIRPORT_CODES = new Set(
  FALLBACK_AIRPORT_OPTIONS.map((a) => a.code.toUpperCase())
)

/** Titles that are not bookable flights */
const FLIGHT_JUNK_PATTERNS = [
  /\bvisa\b/i,
  /\btravel\s*insurance\b/i,
  /\blounge\b/i,
  /\bbus\b/i,
  /\btrain\b/i,
  /\brail\b/i,
  /\bcab\b/i,
  /\btaxi\b/i,
  /\bhotel\b/i,
  /\bresort\b/i,
  /\bpackage\s*tour\b/i,
  /\bholiday\s*package\b/i,
  /\bSIM\b/i,
  /\besim\b/i,
  /\bbaggage\s*only\b/i,
  /\bseat\s*only\b/i,
  /\bmeal\b/i,
  /\bcoupon\b/i,
  /\bgift\s*card\b/i,
]

/** Titles that are not hotel stays */
const HOTEL_JUNK_PATTERNS = [
  /\bhourly\b/i,
  /\bhostel\s*bed\b/i,
  /\bdorm\b/i,
  /\bparking\s*only\b/i,
  /\bday\s*use\s*only\b/i,
  /\bcruise\b/i,
  /\bflight\b/i,
  /\bairline\b/i,
  /\bbus\b/i,
  /\btrain\b/i,
  /\bgift\s*card\b/i,
  /\bcoupon\b/i,
  /\bvisa\b/i,
  /\brental\s*car\b/i,
  /\bcar\s*hire\b/i,
]

export type FlightRouteBounds = {
  minOneWay: number
  maxOneWay: number
  domestic: boolean
}

export function isIndianAirport(code: string): boolean {
  return INDIAN_AIRPORT_CODES.has(code.toUpperCase())
}

export function flightRouteBounds(params: FlightSearchParams): FlightRouteBounds {
  const domestic =
    isIndianAirport(params.originCode) && isIndianAirport(params.destinationCode)

  if (domestic) {
    return { minOneWay: 2_800, maxOneWay: 95_000, domestic: true }
  }
  return { minOneWay: 6_500, maxOneWay: 350_000, domestic: false }
}

export function flightTotalBounds(params: FlightSearchParams): {
  min: number
  max: number
} {
  const { minOneWay, maxOneWay } = flightRouteBounds(params)
  const pax = Math.max(
    1,
    params.passengers.adults +
      params.passengers.children +
      params.passengers.infants
  )
  const mult =
    params.tripType === "return" && params.returnDate ? 1.85 : 1
  return {
    min: Math.round(minOneWay * mult * pax * 0.95),
    max: Math.round(maxOneWay * mult * pax * 1.1),
  }
}

export function isJunkFlightTitle(title: string): boolean {
  return FLIGHT_JUNK_PATTERNS.some((p) => p.test(title))
}

export function flightTitleMatchesRoute(
  title: string,
  origin: string,
  destination: string
): boolean {
  const t = title.toUpperCase()
  const o = origin.toUpperCase()
  const d = destination.toUpperCase()
  if (t.includes(o) && t.includes(d)) return true
  if (t.includes(`${o}-${d}`) || t.includes(`${o} ${d}`)) return true
  if (t.includes(`${o} TO ${d}`) || t.includes(`${o}→${d}`)) return true
  return /\bflight\b/i.test(title) && !isJunkFlightTitle(title)
}

export function hotelNightCount(params: HotelSearchParams): number {
  return Math.max(
    1,
    Math.ceil(
      (new Date(`${params.checkOut}T12:00:00`).getTime() -
        new Date(`${params.checkIn}T12:00:00`).getTime()) /
        86400000
    )
  )
}

export function hotelStayBounds(params: HotelSearchParams): {
  minTotal: number
  maxTotal: number
  minPerNight: number
  maxPerNight: number
} {
  const nights = hotelNightCount(params)
  const rooms = Math.max(1, params.rooms)
  const minPerNight = 900
  const maxPerNight = 45_000
  return {
    minPerNight,
    maxPerNight,
    minTotal: minPerNight * nights * rooms,
    maxTotal: maxPerNight * nights * rooms,
  }
}

export function isJunkHotelTitle(title: string): boolean {
  return HOTEL_JUNK_PATTERNS.some((p) => p.test(title))
}

export function hotelTitleMatchesDestination(
  title: string,
  destination: string
): boolean {
  const dest = destination.trim()
  if (dest.length < 3) return /\bhotel\b/i.test(title)
  const tokens = dest
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 3)
  const t = title.toLowerCase()
  if (tokens.some((tok) => t.includes(tok))) return true
  return /\bhotel\b/i.test(title) && !isJunkHotelTitle(title)
}
