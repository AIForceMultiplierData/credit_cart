import type { TravelListing } from "@/lib/deal-search"
import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"

export type { TravelListing }

function hashSeed(parts: string[]): number {
  let h = 0
  const s = parts.join("|")
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

function seededPrice(seed: number, min: number, spread: number): number {
  const n = (seed % 1000) / 1000
  return Math.round(min + n * spread)
}

const FLIGHT_TEMPLATES = [
  { airline: "IndiGo", code: "6E", duration: "2h 35m", dep: "06:15", arr: "08:50" },
  { airline: "Air India", code: "AI", duration: "2h 45m", dep: "09:40", arr: "12:25" },
  { airline: "Akasa Air", code: "QP", duration: "2h 30m", dep: "14:05", arr: "16:35" },
  { airline: "Air India Express", code: "IX", duration: "2h 50m", dep: "18:20", arr: "21:10" },
  { airline: "SpiceJet", code: "SG", duration: "2h 40m", dep: "21:00", arr: "23:40" },
  { airline: "Vistara", code: "UK", duration: "2h 35m", dep: "11:30", arr: "14:05" },
]

const HOTEL_TEMPLATES = [
  { chain: "OYO", stars: 3, area: "City centre" },
  { chain: "Treebo", stars: 3, area: "Near station" },
  { chain: "FabHotels", stars: 3, area: "Business district" },
  { chain: "Lemon Tree", stars: 4, area: "Airport road" },
  { chain: "ITC", stars: 5, area: "Downtown" },
  { chain: "Taj", stars: 5, area: "Heritage quarter" },
  { chain: "Marriott", stars: 5, area: "Convention hub" },
  { chain: "ibis", stars: 3, area: "Metro corridor" },
]

function timeSlotMatches(slot: FlightSearchParams["timeSlot"], dep: string): boolean {
  if (slot === "any") return true
  const hour = Number(dep.split(":")[0])
  if (slot === "early_morning") return hour < 6
  if (slot === "morning") return hour >= 6 && hour < 12
  if (slot === "afternoon") return hour >= 12 && hour < 18
  return hour >= 18
}

function airlineIdForName(name: string): string {
  const map: Record<string, string> = {
    IndiGo: "indigo",
    "Air India": "air_india",
    "Air India Express": "air_india_express",
    "Akasa Air": "akasa",
    SpiceJet: "spicejet",
    Vistara: "vistara",
  }
  return map[name] ?? name.toLowerCase().replace(/\s+/g, "_")
}

export function generateFlightListings(params: FlightSearchParams): TravelListing[] {
  const seed = hashSeed([
    params.originCode,
    params.destinationCode,
    params.departDate,
    params.returnDate ?? "",
    params.tripType,
  ])
  const pax =
    params.passengers.adults +
    params.passengers.children +
    params.passengers.infants
  const baseMin = 4200 + (params.originCode.charCodeAt(0) % 5) * 800

  let listings: TravelListing[] = FLIGHT_TEMPLATES.map((tpl, i) => {
    const legPrice = seededPrice(seed + i * 17, baseMin, 14000)
    const price =
      params.tripType === "return" && params.returnDate
        ? Math.round(legPrice * 1.75)
        : legPrice
    const refundable = i % 3 !== 2
    return {
      id: `flt-${params.originCode}-${params.destinationCode}-${i}`,
      category: "flight" as const,
      provider: tpl.airline,
      title: `${params.originCode} → ${params.destinationCode} · ${tpl.airline}`,
      subtitle: `${tpl.dep} – ${tpl.arr} · ${tpl.duration}`,
      price: Math.round(price * (pax > 1 ? 0.92 + pax * 0.04 : 1)),
      meta: [
        tpl.code,
        params.tripType === "return" ? "Round trip" : "One way",
        refundable ? "Refundable" : "Non-refundable",
      ],
      refundable,
      badge: i === 0 ? "Lowest fare" : i === 2 ? "Fastest" : undefined,
    }
  })

  if (params.filters.hideNonRefundable) {
    listings = listings.filter((l) => l.refundable)
  }
  if (params.filters.airlines.length > 0) {
    listings = listings.filter((l) =>
      params.filters.airlines.includes(airlineIdForName(l.provider))
    )
  }
  if (params.filters.maxPrice != null) {
    listings = listings.filter((l) => l.price <= params.filters.maxPrice!)
  }
  listings = listings.filter((l) => {
    const tpl = FLIGHT_TEMPLATES.find((t) => t.airline === l.provider)
    return tpl ? timeSlotMatches(params.timeSlot, tpl.dep) : true
  })

  listings.sort((a, b) => {
    if (params.sort === "cheapest") return a.price - b.price
    if (params.sort === "fastest" || params.sort === "shortest") {
      const da = FLIGHT_TEMPLATES.find((t) => t.airline === a.provider)?.duration ?? ""
      const db = FLIGHT_TEMPLATES.find((t) => t.airline === b.provider)?.duration ?? ""
      return da.localeCompare(db)
    }
    return a.price - b.price
  })

  if (listings.length === 0) {
    return generateFlightListings({
      ...params,
      filters: { ...params.filters, airlines: [], hideNonRefundable: false },
      timeSlot: "any",
    }).slice(0, 4)
  }

  return listings.slice(0, 8)
}

export function generateHotelListings(params: HotelSearchParams): TravelListing[] {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(`${params.checkOut}T12:00:00`).getTime() -
        new Date(`${params.checkIn}T12:00:00`).getTime()) /
        86400000
    )
  )
  const seed = hashSeed([
    params.cityCode,
    params.checkIn,
    params.checkOut,
    String(params.rooms),
  ])
  const guests = params.guests.adults + params.guests.children

  let listings: TravelListing[] = HOTEL_TEMPLATES.map((tpl, i) => {
    const perNight = seededPrice(seed + i * 23, 2200 + tpl.stars * 900, 12000)
    const price = Math.round(perNight * nights * params.rooms * (guests > 2 ? 1.08 : 1))
    const refundable = i % 4 !== 3
    return {
      id: `htl-${params.cityCode}-${i}`,
      category: "hotels" as const,
      provider: tpl.chain,
      title: `${tpl.chain} · ${params.city}`,
      subtitle: `${tpl.area} · ${tpl.stars}★ · ${nights} night${nights === 1 ? "" : "s"}`,
      price,
      meta: [
        `${params.rooms} room${params.rooms === 1 ? "" : "s"}`,
        `${guests} guest${guests === 1 ? "" : "s"}`,
        refundable ? "Free cancellation" : "Non-refundable",
      ],
      refundable,
      badge: i === 0 ? "Best value" : tpl.stars >= 5 ? "Luxury" : undefined,
    }
  })

  if (params.filters.hideNonRefundable) {
    listings = listings.filter((l) => l.refundable)
  }
  if (params.filters.minStars > 0) {
    listings = listings.filter((l) => {
      const tpl = HOTEL_TEMPLATES.find((t) => l.provider.startsWith(t.chain))
      return (tpl?.stars ?? 0) >= params.filters.minStars
    })
  }
  if (params.filters.chains.length > 0) {
    listings = listings.filter((l) =>
      params.filters.chains.some(
        (c) => l.provider.toLowerCase().includes(c.toLowerCase())
      )
    )
  }
  if (params.filters.maxPrice != null) {
    listings = listings.filter((l) => l.price <= params.filters.maxPrice!)
  }

  listings.sort((a, b) => {
    if (params.sort === "cheapest") return a.price - b.price
    if (params.sort === "rating") {
      const sa = HOTEL_TEMPLATES.find((t) => a.provider.startsWith(t.chain))?.stars ?? 0
      const sb = HOTEL_TEMPLATES.find((t) => b.provider.startsWith(t.chain))?.stars ?? 0
      return sb - sa
    }
    return a.price - b.price
  })

  return listings.slice(0, 8)
}

export function resolveTravelPrice(
  listings: TravelListing[],
  estimatedFare: number | null,
  selectedListingId?: string | null
): number | null {
  if (selectedListingId) {
    const picked = listings.find((l) => l.id === selectedListingId)
    if (picked) return picked.price
  }
  if (estimatedFare != null && estimatedFare > 0) return estimatedFare
  return listings[0]?.price ?? null
}
