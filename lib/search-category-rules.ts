/**
 * Single source of truth for Product / Flight / Hotel search rules.
 * Serper keywords, price bands, and junk filters stay in sync with listing + card math.
 */

import type { DealSearchCategory } from "@/lib/deal-search"
import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"
import type { ProductSearchParams } from "@/lib/product-search"
import {
  flightTotalBounds,
  hotelStayBounds,
} from "@/lib/travel-query-intent"
import { inferProductIntent } from "@/lib/product-query-intent"

export const DEFAULT_SEARCH_CATEGORY: DealSearchCategory = "product"

export type CategoryRuleSet = {
  category: DealSearchCategory
  label: string
  /** Human-readable steps the pipeline follows */
  pipeline: string[]
  /** Negative keywords appended to Serper shopping queries */
  serperExcludes: string[]
  /** Card ranking must use this price field */
  priceField: "listing" | "user_estimate"
}

export const CATEGORY_RULES: Record<DealSearchCategory, CategoryRuleSet> = {
  product: {
    category: "product",
    label: "Product",
    pipeline: [
      "Parse query intent (phone / laptop / generic)",
      "Serper shopping per major store with accessory exclusions",
      "Filter junk (cases, rentals, refurbished, below min ₹)",
      "Rank wallet + circle cards against selected store URL",
      "If no qualifying card → Ping 50/50 + lender deals",
    ],
    serperExcludes: [
      "-case",
      "-cover",
      "-protector",
      "-guard",
      "-cable",
      "-refurbished",
      "-rental",
      "-compatible",
      "-tempered",
      "-strap",
      "-skin",
      "-film",
      "-repair",
    ],
    priceField: "listing",
  },
  flight: {
    category: "flight",
    label: "Flights",
    pipeline: [
      "Validate route, dates, passengers",
      "OTA + airline fare rows with route/date bounds",
      "Serper shopping for live MMT / Cleartrip fares",
      "Rank travel cards (Regalia, Diners, Magnus…) on OTA URL",
      "Book via pre-filled OTA deep link",
    ],
    serperExcludes: [
      "-visa",
      "-insurance",
      "-bus",
      "-train",
      "-hotel",
    ],
    priceField: "listing",
  },
  hotels: {
    category: "hotels",
    label: "Hotels",
    pipeline: [
      "Confirm destination + stay dates on map",
      "OTA + chain rows with per-night × rooms bounds",
      "Serper shopping for Booking / MMT / Agoda rates",
      "Rank travel cards on OTA checkout URL",
      "Book via pre-filled hotel deep link",
    ],
    serperExcludes: [
      "-hourly",
      "-parking",
      "-flight",
      "-visa",
      "-car rental",
    ],
    priceField: "listing",
  },
}

/** Product — exact handset / gadget price discovery */
export function buildProductShoppingQueries(
  params: ProductSearchParams
): string[] {
  const q = params.query.trim()
  if (!q) return []
  const intent = inferProductIntent(q)

  const isHighTicket = /iphone|samsung|pixel|macbook|laptop|watch|ipad|tablet|camera/i.test(q);
  let excludes = CATEGORY_RULES.product.serperExcludes.join(" ")

  if (isHighTicket) {
    // Force exclusion of accessories and prioritize official retail pricing
    excludes += " -site:amazon.in/dp/*";
  }

  const deviceHint =
    intent.kind === "phone"
      ? "smartphone mobile phone"
      : intent.kind === "laptop"
        ? "laptop notebook"
        : ""

  const primaryQuery = `${q} ${deviceHint} buy online official price in india ${excludes}`.trim()

  return [
    primaryQuery,
    `${q} official store price flipkart.com ${excludes}`,
    `${q} official store price amazon.in ${excludes}`,
    `${q} croma reliancedigital vijaysales price India ${excludes}`,
  ]
}

export function buildProductSerperQuery(params: ProductSearchParams): string {
  const queries = buildProductShoppingQueries(params)
  return queries[0] ?? `${params.query.trim()} buy India price INR`
}

/** Flights — route + date + pax fare discovery */
export function buildFlightShoppingQueries(
  params: FlightSearchParams
): string[] {
  const route = `${params.originCode} to ${params.destinationCode}`
  const pax =
    params.passengers.adults +
    params.passengers.children +
    params.passengers.infants
  const dates =
    params.tripType === "return" && params.returnDate
      ? `${params.departDate} return ${params.returnDate}`
      : params.departDate
  const excludes = CATEGORY_RULES.flight.serperExcludes.join(" ")

  return [
    `flights ${route} ${dates} ${pax} passenger ${params.cabinClass} fare INR makemytrip ${excludes}`,
    `flight tickets ${params.originCode} ${params.destinationCode} ${dates} cleartrip price ${excludes}`,
    `${route} airline fare India ${dates} goibibo INR ${excludes}`,
  ]
}

/** Hotels — city + stay window rate discovery */
export function buildHotelShoppingQueries(
  params: HotelSearchParams
): string[] {
  const dest = (params.destination || params.city).trim()
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(`${params.checkOut}T12:00:00`).getTime() -
        new Date(`${params.checkIn}T12:00:00`).getTime()) /
        86400000
    )
  )
  const excludes = CATEGORY_RULES.hotels.serperExcludes.join(" ")

  return [
    `hotels ${dest} ${params.checkIn} to ${params.checkOut} ${nights} nights booking.com price INR ${excludes}`,
    `hotel ${dest} ${params.checkIn} makemytrip ${params.rooms} room ${excludes}`,
    `${dest} stay ${params.checkIn} agoda cleartrip INR total ${excludes}`,
  ]
}

export function priceBoundsForCategory(
  category: DealSearchCategory,
  context:
    | { productQuery: string }
    | { flight: FlightSearchParams }
    | { hotel: HotelSearchParams }
): { min: number; max: number } | null {
  if (category === "product" && "productQuery" in context) {
    const intent = inferProductIntent(context.productQuery)
    return { min: intent.minPrice, max: intent.maxPrice }
  }
  if (category === "flight" && "flight" in context) {
    const b = flightTotalBounds(context.flight)
    return { min: b.min, max: b.max }
  }
  if (category === "hotels" && "hotel" in context) {
    const b = hotelStayBounds(context.hotel)
    return { min: b.minTotal, max: b.maxTotal }
  }
  return null
}

export function categoryRules(category: DealSearchCategory): CategoryRuleSet {
  return CATEGORY_RULES[category]
}
