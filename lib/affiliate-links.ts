import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"

/**
 * Affiliate markers — leave blank in .env until you have IDs.
 * When set in Vercel, wrap functions append tracking automatically.
 */
export const AFFILIATE_MARKERS = {
  /** Flights + hotels (Travelpayouts → MMT, Cleartrip, Booking, Agoda) */
  travelpayouts:
    (process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER ?? "").trim(),
  /** Product — Amazon India associate tag */
  amazon: (process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? "").trim(),
  /** Product — Flipkart affiliate id */
  flipkart: (process.env.NEXT_PUBLIC_FLIPKART_AFFILIATE_ID ?? "").trim(),
} as const

export type AffiliatePartner =
  | "makemytrip"
  | "cleartrip"
  | "goibibo"
  | "booking"
  | "agoda"
  | "amazon"
  | "flipkart"
  | "product"

export type AffiliateLink = {
  partner: AffiliatePartner
  label: string
  shortLabel: string
  href: string
  primary?: boolean
}

/** Travelpayouts click wrapper — no-op when marker is blank */
export function wrapTravelpayoutsClick(
  targetUrl: string,
  marker: string = AFFILIATE_MARKERS.travelpayouts
): string {
  if (!marker) return targetUrl
  const encoded = encodeURIComponent(targetUrl)
  return `https://c.travelpayouts.com/click?marker=${encodeURIComponent(marker)}&origin=${encoded}`
}

/** Amazon associate tag on product URL — no-op when tag is blank */
export function wrapAmazonProductUrl(
  url: string,
  tag: string = AFFILIATE_MARKERS.amazon
): string {
  if (!tag) return url
  try {
    const parsed = new URL(url)
    if (!/amazon\.(in|com)/i.test(parsed.hostname)) return url
    parsed.searchParams.set("tag", tag)
    return parsed.toString()
  } catch {
    return url
  }
}

/** Flipkart affid on product URL — no-op when id is blank */
export function wrapFlipkartProductUrl(
  url: string,
  affid: string = AFFILIATE_MARKERS.flipkart
): string {
  if (!affid) return url
  try {
    const parsed = new URL(url)
    if (!/flipkart\.com/i.test(parsed.hostname)) return url
    parsed.searchParams.set("affid", affid)
    return parsed.toString()
  } catch {
    return url
  }
}

/** ISO YYYY-MM-DD → DD/MM/YYYY (MakeMyTrip / Cleartrip) */
export function formatDateDdMmYyyy(isoDate: string): string {
  const [y, m, d] = isoDate.split("-")
  if (!y || !m || !d) return isoDate
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`
}

function formatDateYyyymmdd(isoDate: string): string {
  return isoDate.replace(/-/g, "")
}

function cabinForCleartrip(cabin: FlightSearchParams["cabinClass"]): string {
  if (cabin === "business") return "Business"
  if (cabin === "premium_economy") return "Premium Economy"
  return "Economy"
}

function isAmazonUrl(url: string): boolean {
  return /amazon\.(in|com)/i.test(url)
}

function isFlipkartUrl(url: string): boolean {
  return /flipkart\.com/i.test(url)
}

export function buildMakeMyTripFlightUrl(params: FlightSearchParams): string {
  const depart = formatDateDdMmYyyy(params.departDate)
  const origin = params.originCode.toUpperCase()
  const dest = params.destinationCode.toUpperCase()

  let itinerary = `${origin}-${dest}-${depart}`
  if (params.tripType === "return" && params.returnDate) {
    const ret = formatDateDdMmYyyy(params.returnDate)
    itinerary = `${itinerary}_${dest}-${origin}-${ret}`
  }

  const url = new URL("https://www.makemytrip.com/flights/search")
  url.searchParams.set("itinerary", itinerary)
  url.searchParams.set("tripType", params.tripType === "return" ? "R" : "O")
  url.searchParams.set("paxType", "A")
  url.searchParams.set(
    "cabinClass",
    params.cabinClass === "business"
      ? "B"
      : params.cabinClass === "premium_economy"
        ? "PE"
        : "E"
  )
  const adults = params.passengers.adults
  const children = params.passengers.children
  const infants = params.passengers.infants
  if (children > 0 || infants > 0) {
    url.searchParams.set("pax", `A-${adults}_C-${children}_I-${infants}`)
  }

  return wrapTravelpayoutsClick(url.toString())
}

export function buildCleartripFlightUrl(params: FlightSearchParams): string {
  const url = new URL("https://www.cleartrip.com/flights/results")
  url.searchParams.set("from", params.originCode.toUpperCase())
  url.searchParams.set("to", params.destinationCode.toUpperCase())
  url.searchParams.set("depart_date", formatDateDdMmYyyy(params.departDate))
  if (params.tripType === "return" && params.returnDate) {
    url.searchParams.set("return_date", formatDateDdMmYyyy(params.returnDate))
    url.searchParams.set("roundtrip", "y")
  }
  url.searchParams.set("adults", String(params.passengers.adults))
  url.searchParams.set("childs", String(params.passengers.children))
  url.searchParams.set("infants", String(params.passengers.infants))
  url.searchParams.set("class", cabinForCleartrip(params.cabinClass))
  return wrapTravelpayoutsClick(url.toString())
}

export function buildGoibiboFlightUrl(params: FlightSearchParams): string {
  const url = new URL("https://www.goibibo.com/flights/")
  url.searchParams.set("t", params.tripType === "return" ? "R" : "O")
  url.searchParams.set(
    "p",
    `${params.originCode}-${params.destinationCode}-${formatDateDdMmYyyy(params.departDate)}`
  )
  if (params.tripType === "return" && params.returnDate) {
    url.searchParams.set(
      "r",
      `${params.destinationCode}-${params.originCode}-${formatDateDdMmYyyy(params.returnDate)}`
    )
  }
  url.searchParams.set("c", String(params.passengers.adults))
  url.searchParams.set("i", String(params.passengers.children))
  url.searchParams.set("b", String(params.passengers.infants))
  return wrapTravelpayoutsClick(url.toString())
}

export function buildMakeMyTripHotelUrl(params: HotelSearchParams): string {
  const city = params.destination || params.city
  const url = new URL("https://www.makemytrip.com/hotels/hotel-listing/")
  url.searchParams.set("checkin", formatDateDdMmYyyy(params.checkIn))
  url.searchParams.set("checkout", formatDateDdMmYyyy(params.checkOut))
  url.searchParams.set("city", city)
  url.searchParams.set("country", "IN")
  url.searchParams.set("roomStayQualifier", `${params.guests.adults}e`)
  url.searchParams.set("roomCount", String(params.rooms))
  if (params.lat != null && params.lng != null) {
    url.searchParams.set("lat", String(params.lat))
    url.searchParams.set("lng", String(params.lng))
  }
  return wrapTravelpayoutsClick(url.toString())
}

export function buildBookingHotelUrl(params: HotelSearchParams): string {
  const destination = params.destination || params.city
  const url = new URL("https://www.booking.com/searchresults.html")
  url.searchParams.set("ss", destination)
  url.searchParams.set("checkin", params.checkIn)
  url.searchParams.set("checkout", params.checkOut)
  url.searchParams.set("group_adults", String(params.guests.adults))
  url.searchParams.set("group_children", String(params.guests.children))
  url.searchParams.set("no_rooms", String(params.rooms))
  url.searchParams.set("lang", "en-gb")
  url.searchParams.set("selected_currency", "INR")
  return wrapTravelpayoutsClick(url.toString())
}

export function buildAgodaHotelUrl(params: HotelSearchParams): string {
  const destination = params.destination || params.city
  const url = new URL("https://www.agoda.com/search")
  url.searchParams.set("city", destination)
  url.searchParams.set("checkIn", formatDateYyyymmdd(params.checkIn))
  url.searchParams.set("checkOut", formatDateYyyymmdd(params.checkOut))
  url.searchParams.set("rooms", String(params.rooms))
  url.searchParams.set("adults", String(params.guests.adults))
  url.searchParams.set("children", String(params.guests.children))
  url.searchParams.set("cid", "-1")
  url.searchParams.set("currency", "INR")
  return wrapTravelpayoutsClick(url.toString())
}

export function buildFlightAffiliateLinks(
  params: FlightSearchParams
): AffiliateLink[] {
  return [
    {
      partner: "makemytrip",
      label: "Book on MakeMyTrip",
      shortLabel: "MakeMyTrip",
      href: buildMakeMyTripFlightUrl(params),
      primary: true,
    },
    {
      partner: "cleartrip",
      label: "Book on Cleartrip",
      shortLabel: "Cleartrip",
      href: buildCleartripFlightUrl(params),
    },
    {
      partner: "goibibo",
      label: "Book on Goibibo",
      shortLabel: "Goibibo",
      href: buildGoibiboFlightUrl(params),
    },
  ]
}

export function buildHotelAffiliateLinks(
  params: HotelSearchParams
): AffiliateLink[] {
  return [
    {
      partner: "booking",
      label: "Search on Booking.com",
      shortLabel: "Booking.com",
      href: buildBookingHotelUrl(params),
      primary: true,
    },
    {
      partner: "makemytrip",
      label: "Book on MakeMyTrip",
      shortLabel: "MakeMyTrip",
      href: buildMakeMyTripHotelUrl(params),
    },
    {
      partner: "agoda",
      label: "Search on Agoda",
      shortLabel: "Agoda",
      href: buildAgodaHotelUrl(params),
    },
  ]
}

function buildAmazonSearchUrl(query: string): string {
  const url = new URL("https://www.amazon.in/s")
  url.searchParams.set("k", query)
  return wrapAmazonProductUrl(url.toString())
}

function buildFlipkartSearchUrl(query: string): string {
  const url = new URL("https://www.flipkart.com/search")
  url.searchParams.set("q", query)
  return wrapFlipkartProductUrl(url.toString())
}

/** Product deep links from pasted URL — affiliate params added when markers are set */
export function buildProductAffiliateLinks(
  sourceUrl: string,
  platform: string,
  productTitle?: string
): AffiliateLink[] {
  const links: AffiliateLink[] = []
  const title = productTitle?.trim() || "product"
  const onAmazon = isAmazonUrl(sourceUrl) || /amazon/i.test(platform)
  const onFlipkart = isFlipkartUrl(sourceUrl) || /flipkart/i.test(platform)

  if (onAmazon && /^https?:\/\//i.test(sourceUrl)) {
    links.push({
      partner: "amazon",
      label: "Buy on Amazon",
      shortLabel: "Amazon",
      href: wrapAmazonProductUrl(sourceUrl),
      primary: true,
    })
  }

  if (onFlipkart && /^https?:\/\//i.test(sourceUrl)) {
    links.push({
      partner: "flipkart",
      label: "Buy on Flipkart",
      shortLabel: "Flipkart",
      href: wrapFlipkartProductUrl(sourceUrl),
      primary: links.length === 0,
    })
  }

  if (links.length === 0 && /^https?:\/\//i.test(sourceUrl)) {
    links.push({
      partner: "product",
      label: `Open on ${platform || "store"}`,
      shortLabel: platform || "Store",
      href: sourceUrl,
      primary: true,
    })
  }

  if (!onAmazon) {
    links.push({
      partner: "amazon",
      label: onAmazon ? "Buy on Amazon" : "Search on Amazon",
      shortLabel: "Amazon",
      href: onAmazon
        ? wrapAmazonProductUrl(sourceUrl)
        : buildAmazonSearchUrl(title),
      primary: links.length === 0,
    })
  }

  if (!onFlipkart) {
    links.push({
      partner: "flipkart",
      label: onFlipkart ? "Buy on Flipkart" : "Search on Flipkart",
      shortLabel: "Flipkart",
      href: onFlipkart
        ? wrapFlipkartProductUrl(sourceUrl)
        : buildFlipkartSearchUrl(title),
      primary: false,
    })
  }

  const seen = new Set<string>()
  return links.filter((link) => {
    if (seen.has(link.href)) return false
    seen.add(link.href)
    return true
  })
}

export function primaryAffiliateBookLabel(
  category: "flight" | "hotels" | "product",
  cardName?: string | null,
  platform?: string | null
): string {
  const card = cardName?.trim() ? ` with ${cardName}` : ""
  if (category === "flight") {
    return `Apply card & book on MakeMyTrip${card}`
  }
  if (category === "hotels") {
    return `Apply card & search on Booking.com${card}`
  }
  const store = platform?.trim() || "store"
  return `Apply card & checkout on ${store}${card}`
}
