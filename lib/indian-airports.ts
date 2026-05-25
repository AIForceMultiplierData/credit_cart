import {
  FALLBACK_AIRPORT_OPTIONS,
  toAirportOption,
  type IndianAirportRow,
} from "@/lib/indian-airports-seed"

export type IndianAirport = {
  code: string
  city: string
  label: string
  airportName: string
  state: string
}

export function mapDbRowToAirport(row: {
  iata_code: string
  city: string
  airport_name: string
  state: string
  label: string
}): IndianAirport {
  return {
    code: row.iata_code,
    city: row.city,
    label: row.label,
    airportName: row.airport_name,
    state: row.state,
  }
}

export function mapSeedRow(row: IndianAirportRow): IndianAirport {
  return toAirportOption(row)
}

export function filterAirports(
  airports: IndianAirport[],
  query: string
): IndianAirport[] {
  const q = query.trim().toLowerCase()
  if (!q) return airports
  return airports.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.label.toLowerCase().includes(q) ||
      a.airportName.toLowerCase().includes(q) ||
      a.state.toLowerCase().includes(q)
  )
}

export { FALLBACK_AIRPORT_OPTIONS }
