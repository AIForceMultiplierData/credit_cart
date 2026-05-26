import type { TravelListing } from "@/lib/deal-search"
import {
  buildAgodaHotelUrl,
  buildBookingHotelUrl,
  buildCleartripFlightUrl,
  buildCleartripHotelUrl,
  buildGoibiboFlightUrl,
  buildMakeMyTripFlightUrl,
  buildMakeMyTripHotelUrl,
} from "@/lib/affiliate-links"
import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"
import { SERPER_API_KEYS } from "@/lib/llm-router"
import {
  fetchSerperShopping,
  parseInrPrice,
} from "@/lib/serper-client"
import type { ListingsFetchResult } from "@/lib/product-listings"
import {
  buildFlightShoppingQueries,
  buildHotelShoppingQueries,
} from "@/lib/search-category-rules"
import {
  flightRouteBounds,
  flightTitleMatchesRoute,
  flightTotalBounds,
  hotelNightCount,
  hotelStayBounds,
  hotelTitleMatchesDestination,
  isJunkFlightTitle,
  isJunkHotelTitle,
} from "@/lib/travel-query-intent"

export type { ListingsFetchResult }

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

const FLIGHT_AIRLINES = [
  { airline: "IndiGo", code: "6E", duration: "2h 35m", dep: "06:15", arr: "08:50" },
  { airline: "Air India", code: "AI", duration: "2h 45m", dep: "09:40", arr: "12:25" },
  { airline: "Akasa Air", code: "QP", duration: "2h 30m", dep: "14:05", arr: "16:35" },
  { airline: "Air India Express", code: "IX", duration: "2h 50m", dep: "18:20", arr: "21:10" },
  { airline: "SpiceJet", code: "SG", duration: "2h 40m", dep: "21:00", arr: "23:40" },
]

const HOTEL_CHAINS = [
  { chain: "Lemon Tree", stars: 4, area: "City centre" },
  { chain: "ITC", stars: 5, area: "Downtown" },
  { chain: "Taj", stars: 5, area: "Heritage quarter" },
  { chain: "Marriott", stars: 5, area: "Business district" },
  { chain: "Treebo", stars: 3, area: "Near station" },
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

function scoreFlightListing(
  listing: TravelListing,
  params: FlightSearchParams
): number {
  const bounds = flightTotalBounds(params)
  if (isJunkFlightTitle(listing.title)) return -1_000
  if (listing.price < bounds.min || listing.price > bounds.max) return -500
  if (!flightTitleMatchesRoute(listing.title, params.originCode, params.destinationCode)) {
    return -300
  }
  let score = 50
  if (/makemytrip|cleartrip|goibibo|booking/i.test(listing.provider)) score += 90
  if (listing.product_url && !/google\./i.test(listing.product_url)) score += 40
  if (FLIGHT_AIRLINES.some((a) => a.airline === listing.provider)) score += 60
  return score
}

function scoreHotelListing(
  listing: TravelListing,
  params: HotelSearchParams
): number {
  const dest = params.destination || params.city
  const bounds = hotelStayBounds(params)
  if (isJunkHotelTitle(listing.title)) return -1_000
  if (listing.price < bounds.minTotal || listing.price > bounds.maxTotal) {
    return -500
  }
  if (!hotelTitleMatchesDestination(listing.title, dest)) return -250
  let score = 50
  if (/booking|makemytrip|agoda|cleartrip|oyo|taj|itc|marriott/i.test(listing.provider)) {
    score += 70
  }
  if (listing.product_url && !/google\./i.test(listing.product_url)) score += 40
  return score
}

function listingFromSerperFlight(
  item: { title?: string; price?: string; source?: string; link?: string },
  params: FlightSearchParams,
  index: number,
  bookUrl: string,
  provider: string
): TravelListing | null {
  const price = parseInrPrice(item.price)
  if (!price) return null
  const title = item.title?.trim() || `${params.originCode} → ${params.destinationCode}`
  if (isJunkFlightTitle(title)) return null

  const listing: TravelListing = {
    id: `flt-serper-${provider}-${index}`,
    category: "flight",
    provider,
    title,
    subtitle: `${params.originCode} → ${params.destinationCode} · book on ${provider}`,
    price,
    meta: ["Live fare", provider],
    refundable: true,
    product_url: /google\./i.test(item.link ?? "") ? bookUrl : item.link?.trim() || bookUrl,
  }

  return scoreFlightListing(listing, params) >= 0 ? listing : null
}

function listingFromSerperHotel(
  item: { title?: string; price?: string; source?: string; link?: string },
  params: HotelSearchParams,
  index: number,
  bookUrl: string,
  provider: string
): TravelListing | null {
  const price = parseInrPrice(item.price)
  if (!price) return null
  const dest = params.destination || params.city
  const title = item.title?.trim() || `Hotel · ${dest}`
  if (isJunkHotelTitle(title)) return null

  const listing: TravelListing = {
    id: `htl-serper-${provider}-${index}`,
    category: "hotels",
    provider,
    title,
    subtitle: `${dest} · ${hotelNightCount(params)} night(s)`,
    price,
    meta: ["Live rate", provider],
    refundable: true,
    product_url: /google\./i.test(item.link ?? "") ? bookUrl : item.link?.trim() || bookUrl,
  }

  return scoreHotelListing(listing, params) >= 0 ? listing : null
}

function generateOtaFlightListings(params: FlightSearchParams): TravelListing[] {
  const bounds = flightTotalBounds(params)
  const seed = hashSeed([
    params.originCode,
    params.destinationCode,
    params.departDate,
    params.returnDate ?? "",
  ])
  const mid = Math.round((bounds.min + bounds.max) / 2)
  const spread = Math.round((bounds.max - bounds.min) / 3)

  const otas = [
    {
      provider: "MakeMyTrip",
      url: buildMakeMyTripFlightUrl(params),
      price: seededPrice(seed + 1, mid - spread / 2, spread),
    },
    {
      provider: "Cleartrip",
      url: buildCleartripFlightUrl(params),
      price: seededPrice(seed + 2, mid - spread / 3, spread),
    },
    {
      provider: "Goibibo",
      url: buildGoibiboFlightUrl(params),
      price: seededPrice(seed + 3, mid, spread),
    },
  ]

  return otas.map((ota, i) => ({
    id: `flt-ota-${ota.provider}`,
    category: "flight" as const,
    provider: ota.provider,
    title: `${params.originCode} → ${params.destinationCode} · ${ota.provider}`,
    subtitle:
      params.tripType === "return" && params.returnDate
        ? "Round trip · pre-filled on OTA"
        : "One way · pre-filled on OTA",
    price: ota.price,
    meta: ["OTA search", ota.provider],
    refundable: true,
    product_url: ota.url,
    badge: i === 0 ? "Recommended OTA" : undefined,
  }))
}

function generateAirlineFlightListings(params: FlightSearchParams): TravelListing[] {
  const bounds = flightTotalBounds(params)
  const seed = hashSeed([params.originCode, params.destinationCode, params.departDate])
  const pax = Math.max(
    1,
    params.passengers.adults +
      params.passengers.children +
      params.passengers.infants
  )
  const { minOneWay, maxOneWay } = flightRouteBounds(params)
  const spread = maxOneWay - minOneWay
  const mmtUrl = buildMakeMyTripFlightUrl(params)

  let listings: TravelListing[] = FLIGHT_AIRLINES.map((tpl, i) => {
    let legPrice = seededPrice(seed + i * 17, minOneWay, spread * 0.35)
    if (params.tripType === "return" && params.returnDate) {
      legPrice = Math.round(legPrice * 1.75)
    }
    const price = Math.round(legPrice * (pax > 1 ? 0.92 + pax * 0.04 : 1))
    return {
      id: `flt-air-${tpl.code}-${i}`,
      category: "flight" as const,
      provider: tpl.airline,
      title: `${params.originCode} → ${params.destinationCode} · ${tpl.airline}`,
      subtitle: `${tpl.dep} – ${tpl.arr} · ${tpl.duration}`,
      price,
      meta: [tpl.code, tpl.airline, "Book via OTA"],
      refundable: i % 3 !== 2,
      product_url: mmtUrl,
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
    const tpl = FLIGHT_AIRLINES.find((t) => t.airline === l.provider)
    return tpl ? timeSlotMatches(params.timeSlot, tpl.dep) : true
  })

  return listings.filter((l) => scoreFlightListing(l, params) >= 0)
}

function generateOtaHotelListings(params: HotelSearchParams): TravelListing[] {
  const nights = hotelNightCount(params)
  const bounds = hotelStayBounds(params)
  const seed = hashSeed([params.destination, params.checkIn, params.checkOut])
  const mid = Math.round((bounds.minTotal + bounds.maxTotal) / 2)
  const spread = Math.round((bounds.maxTotal - bounds.minTotal) / 4)

  const otas = [
    { provider: "Booking.com", url: buildBookingHotelUrl(params), offset: 1 },
    { provider: "MakeMyTrip", url: buildMakeMyTripHotelUrl(params), offset: 2 },
    { provider: "Agoda", url: buildAgodaHotelUrl(params), offset: 3 },
    { provider: "Cleartrip", url: buildCleartripHotelUrl(params), offset: 4 },
  ]

  return otas.map((ota, i) => ({
    id: `htl-ota-${ota.provider}`,
    category: "hotels" as const,
    provider: ota.provider,
    title: `${params.destination || params.city} · ${ota.provider}`,
    subtitle: `${nights} night${nights === 1 ? "" : "s"} · dates pre-filled`,
    price: seededPrice(seed + ota.offset, mid - spread / 2, spread),
    meta: ["OTA search", ota.provider],
    refundable: true,
    product_url: ota.url,
    badge: i === 0 ? "Recommended OTA" : undefined,
  }))
}

function generateChainHotelListings(params: HotelSearchParams): TravelListing[] {
  const nights = hotelNightCount(params)
  const bounds = hotelStayBounds(params)
  const seed = hashSeed([
    params.placeId ?? params.cityCode,
    params.destination || params.city,
    params.checkIn,
    params.checkOut,
  ])
  const guests = params.guests.adults + params.guests.children
  const bookUrl = buildBookingHotelUrl(params)

  let listings: TravelListing[] = HOTEL_CHAINS.map((tpl, i) => {
    const perNight = seededPrice(
      seed + i * 23,
      bounds.minPerNight + tpl.stars * 800,
      bounds.maxPerNight - bounds.minPerNight
    )
    const price = Math.round(
      perNight * nights * params.rooms * (guests > 2 ? 1.08 : 1)
    )
    return {
      id: `htl-chain-${i}`,
      category: "hotels" as const,
      provider: tpl.chain,
      title: `${tpl.chain} · ${params.destination || params.city}`,
      subtitle: `${tpl.area} · ${tpl.stars}★ · ${nights} night${nights === 1 ? "" : "s"}`,
      price,
      meta: [
        `${params.rooms} room${params.rooms === 1 ? "" : "s"}`,
        `${guests} guest${guests === 1 ? "" : "s"}`,
      ],
      refundable: i % 3 !== 2,
      product_url: bookUrl,
    }
  })

  if (params.filters.hideNonRefundable) {
    listings = listings.filter((l) => l.refundable)
  }
  if (params.filters.minStars > 0) {
    listings = listings.filter((l) => {
      const tpl = HOTEL_CHAINS.find((t) => l.provider.startsWith(t.chain))
      return (tpl?.stars ?? 0) >= params.filters.minStars
    })
  }
  if (params.filters.maxPrice != null) {
    listings = listings.filter((l) => l.price <= params.filters.maxPrice!)
  }

  return listings.filter((l) => scoreHotelListing(l, params) >= 0)
}

function finalizeFlightListings(
  listings: TravelListing[],
  params: FlightSearchParams
): TravelListing[] {
  const scored = listings
    .map((l) => ({ l, s: scoreFlightListing(l, params) }))
    .filter((x) => x.s >= 0)

  scored.sort((a, b) => {
    if (params.sort === "cheapest") return a.l.price - b.l.price
    if (params.sort === "fastest" || params.sort === "shortest") {
      return b.s - a.s
    }
    if (b.s !== a.s) return b.s - a.s
    return a.l.price - b.l.price
  })

  const output = scored.map((x) => x.l).slice(0, 8)
  const best = pickDefaultFlightListing(output, params)
  const cheapest = [...output].sort((a, b) => a.price - b.price)[0]

  return output.map((row) => ({
    ...row,
    badge:
      row.id === best?.id
        ? "Best match"
        : row.id === cheapest?.id && cheapest.id !== best?.id
          ? "Lowest fare"
          : row.badge,
  }))
}

function finalizeHotelListings(
  listings: TravelListing[],
  params: HotelSearchParams
): TravelListing[] {
  const scored = listings
    .map((l) => ({ l, s: scoreHotelListing(l, params) }))
    .filter((x) => x.s >= 0)

  scored.sort((a, b) => {
    if (params.sort === "cheapest") return a.l.price - b.l.price
    if (params.sort === "rating") return b.s - a.s
    if (b.s !== a.s) return b.s - a.s
    return a.l.price - b.l.price
  })

  const output = scored.map((x) => x.l).slice(0, 8)
  const best = pickDefaultHotelListing(output, params)
  const cheapest = [...output].sort((a, b) => a.price - b.price)[0]

  return output.map((row) => ({
    ...row,
    badge:
      row.id === best?.id
        ? "Best match"
        : row.id === cheapest?.id && cheapest.id !== best?.id
          ? "Lowest stay"
          : row.badge,
  }))
}

function listingFromSerperFlightRaw(
  item: { title?: string; price?: string; source?: string; link?: string },
  params: FlightSearchParams,
  index: number,
  bookUrl: string,
  provider: string
): TravelListing | null {
  const price = parseInrPrice(item.price)
  if (!price) return null
  const title = item.title?.trim() || `${params.originCode} → ${params.destinationCode}`
  return {
    id: `flt-raw-${index}`,
    category: "flight",
    provider,
    title,
    subtitle: "Raw Serper fare",
    price,
    meta: ["Raw Serper", provider],
    refundable: true,
    product_url: item.link?.trim() || bookUrl,
  }
}

export async function fetchFlightListings(
  params: FlightSearchParams
): Promise<ListingsFetchResult> {
  const listings: TravelListing[] = [
    ...generateOtaFlightListings(params),
    ...generateAirlineFlightListings(params),
  ]
  const raw_listings: TravelListing[] = [...listings]
  const serper_queries = buildFlightShoppingQueries(params)

  if (SERPER_API_KEYS.length > 0) {
    const batches = await Promise.all(
      serper_queries.map((q) => fetchSerperShopping(q, 4))
    )
    let idx = 0
    for (const batch of batches) {
      for (const item of batch) {
        const src = (item.source ?? "").toLowerCase()
        const provider = /makemytrip|mmt/.test(src)
          ? "MakeMyTrip"
          : /cleartrip/.test(src)
            ? "Cleartrip"
            : /goibibo/.test(src)
              ? "Goibibo"
              : "Flight offer"
        const bookUrl =
          provider === "Cleartrip"
            ? buildCleartripFlightUrl(params)
            : provider === "Goibibo"
              ? buildGoibiboFlightUrl(params)
              : buildMakeMyTripFlightUrl(params)
        const raw = listingFromSerperFlightRaw(item, params, idx, bookUrl, provider)
        if (raw) raw_listings.push(raw)
        const row = listingFromSerperFlight(item, params, idx, bookUrl, provider)
        if (row) listings.push(row)
        idx += 1
      }
    }
  }

  return {
    listings: finalizeFlightListings(listings, params),
    raw_listings,
    serper_queries,
  }
}

function listingFromSerperHotelRaw(
  item: { title?: string; price?: string; source?: string; link?: string },
  params: HotelSearchParams,
  index: number,
  bookUrl: string,
  provider: string
): TravelListing | null {
  const price = parseInrPrice(item.price)
  if (!price) return null
  const dest = params.destination || params.city
  const title = item.title?.trim() || `Hotel · ${dest}`
  return {
    id: `htl-raw-${index}`,
    category: "hotels",
    provider,
    title,
    subtitle: "Raw Serper rate",
    price,
    meta: ["Raw Serper", provider],
    refundable: true,
    product_url: item.link?.trim() || bookUrl,
  }
}

export async function fetchHotelListings(
  params: HotelSearchParams
): Promise<ListingsFetchResult> {
  const listings: TravelListing[] = [
    ...generateOtaHotelListings(params),
    ...generateChainHotelListings(params),
  ]
  const raw_listings: TravelListing[] = [...listings]
  const serper_queries = buildHotelShoppingQueries(params)

  if (SERPER_API_KEYS.length > 0) {
    const batches = await Promise.all(
      serper_queries.map((q) => fetchSerperShopping(q, 4))
    )
    let idx = 0
    for (const batch of batches) {
      for (const item of batch) {
        const src = (item.source ?? "").toLowerCase()
        const provider = /booking/.test(src)
          ? "Booking.com"
          : /makemytrip|mmt/.test(src)
            ? "MakeMyTrip"
            : /agoda/.test(src)
              ? "Agoda"
              : /cleartrip/.test(src)
                ? "Cleartrip"
                : "Hotel offer"
        const bookUrl =
          provider === "MakeMyTrip"
            ? buildMakeMyTripHotelUrl(params)
            : provider === "Agoda"
              ? buildAgodaHotelUrl(params)
              : provider === "Cleartrip"
                ? buildCleartripHotelUrl(params)
                : buildBookingHotelUrl(params)
        const raw = listingFromSerperHotelRaw(item, params, idx, bookUrl, provider)
        if (raw) raw_listings.push(raw)
        const row = listingFromSerperHotel(item, params, idx, bookUrl, provider)
        if (row) listings.push(row)
        idx += 1
      }
    }
  }

  return {
    listings: finalizeHotelListings(listings, params),
    raw_listings,
    serper_queries,
  }
}

/** @deprecated Use fetchFlightListings */
export function generateFlightListings(
  params: FlightSearchParams
): TravelListing[] {
  return finalizeFlightListings(
    [
      ...generateOtaFlightListings(params),
      ...generateAirlineFlightListings(params),
    ],
    params
  )
}

/** @deprecated Use fetchHotelListings */
export function generateHotelListings(
  params: HotelSearchParams
): TravelListing[] {
  return finalizeHotelListings(
    [...generateOtaHotelListings(params), ...generateChainHotelListings(params)],
    params
  )
}

export function pickDefaultFlightListing(
  listings: TravelListing[],
  params: FlightSearchParams
): TravelListing | null {
  const scored = listings
    .map((l) => ({ l, s: scoreFlightListing(l, params) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
  return scored[0]?.l ?? listings[0] ?? null
}

export function pickDefaultHotelListing(
  listings: TravelListing[],
  params: HotelSearchParams
): TravelListing | null {
  const scored = listings
    .map((l) => ({ l, s: scoreHotelListing(l, params) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
  return scored[0]?.l ?? listings[0] ?? null
}

export function resolveFlightListing(
  listings: TravelListing[],
  estimatedFare: number | null,
  selectedListingId: string | null | undefined,
  params: FlightSearchParams
): { listing: TravelListing | null; price: number | null } {
  const bounds = flightTotalBounds(params)

  if (selectedListingId) {
    const picked = listings.find((l) => l.id === selectedListingId)
    if (picked && scoreFlightListing(picked, params) >= 0) {
      const price =
        picked.price >= bounds.min ? picked.price : estimatedFare ?? null
      return { listing: picked, price }
    }
  }

  const best = pickDefaultFlightListing(listings, params)
  if (best && best.price >= bounds.min) {
    return { listing: best, price: best.price }
  }

  if (estimatedFare != null && estimatedFare >= bounds.min) {
    return { listing: best ?? listings[0] ?? null, price: estimatedFare }
  }

  const priced = listings.find(
    (l) => l.price >= bounds.min && scoreFlightListing(l, params) >= 0
  )
  return { listing: priced ?? best ?? null, price: priced?.price ?? null }
}

export function resolveHotelListing(
  listings: TravelListing[],
  estimatedTotal: number | null,
  selectedListingId: string | null | undefined,
  params: HotelSearchParams
): { listing: TravelListing | null; price: number | null } {
  const bounds = hotelStayBounds(params)

  if (selectedListingId) {
    const picked = listings.find((l) => l.id === selectedListingId)
    if (picked && scoreHotelListing(picked, params) >= 0) {
      const price =
        picked.price >= bounds.minTotal
          ? picked.price
          : estimatedTotal ?? null
      return { listing: picked, price }
    }
  }

  const best = pickDefaultHotelListing(listings, params)
  if (best && best.price >= bounds.minTotal) {
    return { listing: best, price: best.price }
  }

  if (estimatedTotal != null && estimatedTotal >= bounds.minTotal) {
    return { listing: best ?? listings[0] ?? null, price: estimatedTotal }
  }

  const priced = listings.find(
    (l) => l.price >= bounds.minTotal && scoreHotelListing(l, params) >= 0
  )
  return { listing: priced ?? best ?? null, price: priced?.price ?? null }
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
