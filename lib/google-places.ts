export type PlaceSuggestion = {
  placeId: string
  mainText: string
  secondaryText: string
  description: string
}

export type PlaceDetails = {
  placeId: string
  name: string
  formattedAddress: string
  lat: number
  lng: number
}

export function getGoogleMapsApiKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || null
}

export function buildPlaceEmbedUrl(
  placeId: string,
  lat: number,
  lng: number,
  apiKey: string
): string {
  const q = placeId ? `place_id:${placeId}` : `${lat},${lng}`
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&zoom=14`
}
