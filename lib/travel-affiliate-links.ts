import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"

/** Travelpayouts partner marker — set in Vercel as NEXT_PUBLIC_TRAVELPAYOUTS_MARKER */
const TRAVELPAYOUTS_MARKER =
  process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER?.trim() || ""

export type TravelOtaPartner =
  | "makemytrip"
  | "cleartrip"
  | "goibibo"
  | "booking"
  | "agoda"

export type TravelAffiliateLink = {
  partner: TravelOtaPartner
  label: string
  shortLabel: string
  href: string
  primary?: boolean
}

/** ISO YYYY-MM-DD → DD/MM/YYYY (MakeMyTrip / Cleartrip) */
export function formatDateDdMmYyyy(isoDate: string): string {
  const [y, m, d] = isoDate.split("-")
  if (!y || !m || !d) return isoDate
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`
}

/** ISO → YYYYMMDD for some hotel URLs */
function formatDateYyyymmdd(isoDate: string): string {
  return isoDate.replace(/-/g, "")
}

export function wrapTravelpayoutsClick(targetUrl: string): string {
  if (!TRAVELPAYOUTS_MARKER) return targetUrl
  const encoded = encodeURIComponent(targetUrl)
  return `https://c.travelpayouts.com/click?marker=${encodeURIComponent(TRAVELPAYOUTS_MARKER)}&origin=${encoded}`
}

function cabinForCleartrip(cabin: FlightSearchParams["cabinClass"]): string {
  if (cabin === "business") return "Business"
  if (cabin === "premium_economy") return "Premium Economy"
  return "Economy"
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
  url.searchParams.set("p", `${params.originCode}-${params.destinationCode}-${formatDateDdMmYyyy(params.departDate)}`)
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
): TravelAffiliateLink[] {
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
): TravelAffiliateLink[] {
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

/** Primary CTA copy next to best-card recommendation */
export function primaryTravelBookLabel(
  category: "flight" | "hotels",
  cardName?: string | null
): string {
  const card = cardName?.trim() ? ` with ${cardName}` : ""
  if (category === "flight") {
    return `Apply card & book on MakeMyTrip${card}`
  }
  return `Apply card & search on Booking.com${card}`
}
