import { NextResponse } from "next/server"
import { getGoogleMapsApiKey, type PlaceDetails } from "@/lib/google-places"

export async function GET(request: Request) {
  const key = getGoogleMapsApiKey()
  if (!key) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get("placeId")?.trim()
  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 })
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  )
  url.searchParams.set("place_id", placeId)
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,geometry"
  )
  url.searchParams.set("key", key)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = (await res.json()) as {
    status: string
    result?: {
      place_id: string
      name: string
      formatted_address: string
      geometry?: { location?: { lat: number; lng: number } }
    }
    error_message?: string
  }

  if (data.status !== "OK" || !data.result?.geometry?.location) {
    return NextResponse.json(
      { error: data.error_message ?? data.status ?? "Place not found" },
      { status: 502 }
    )
  }

  const r = data.result
  const loc = r.geometry!.location!
  const details: PlaceDetails = {
    placeId: r.place_id,
    name: r.name,
    formattedAddress: r.formatted_address,
    lat: loc.lat,
    lng: loc.lng,
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=place_id:${encodeURIComponent(placeId)}&zoom=14`

  return NextResponse.json({ details, embedUrl })
}
