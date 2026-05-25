"use client"

import { useEffect, useState } from "react"
import {
  FALLBACK_AIRPORT_OPTIONS,
  mapDbRowToAirport,
  type IndianAirport,
} from "@/lib/indian-airports"
import { supabase } from "@/lib/supabase"

let cachedAirports: IndianAirport[] | null = null
let loadPromise: Promise<IndianAirport[]> | null = null

async function fetchIndianAirports(): Promise<IndianAirport[]> {
  if (cachedAirports) return cachedAirports
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const { data, error } = await supabase
      .from("indian_airports")
      .select("iata_code, city, airport_name, state, label")
      .eq("is_active", true)
      .order("city", { ascending: true })

    if (!error && data && data.length > 0) {
      cachedAirports = data.map(mapDbRowToAirport)
      return cachedAirports
    }

    cachedAirports = FALLBACK_AIRPORT_OPTIONS
    return cachedAirports
  })()

  return loadPromise
}

export function useIndianAirports() {
  const [airports, setAirports] = useState<IndianAirport[]>(
    cachedAirports ?? FALLBACK_AIRPORT_OPTIONS
  )
  const [loading, setLoading] = useState(!cachedAirports)
  useEffect(() => {
    let cancelled = false
    fetchIndianAirports().then((list) => {
      if (cancelled) return
      setAirports(list)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { airports, loading }
}
