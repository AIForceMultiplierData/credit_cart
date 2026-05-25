import { NextResponse } from "next/server"
import { getGoogleMapsApiKey, type PlaceSuggestion } from "@/lib/google-places"

export async function GET(request: Request) {
  const key = getGoogleMapsApiKey()
  if (!key) {
    return NextResponse.json(
      { error: "Google Maps API key not configured", suggestions: [] },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const input = searchParams.get("q")?.trim() ?? ""
  if (input.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  )
  url.searchParams.set("input", input)
  url.searchParams.set("key", key)
  url.searchParams.set("components", "country:in")

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = (await res.json()) as {
    status: string
    predictions?: Array<{
      place_id: string
      description: string
      structured_formatting?: {
        main_text: string
        secondary_text: string
      }
    }>
    error_message?: string
  }

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      {
        error: data.error_message ?? data.status,
        suggestions: [],
      },
      { status: 502 }
    )
  }

  const suggestions: PlaceSuggestion[] = (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? "",
  }))

  return NextResponse.json({ suggestions })
}
