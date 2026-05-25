/**
 * Real card face photos (public/images/cards).
 * Falls back to SVG art in card-art-registry when a photo is missing.
 */

import { CARD_ART, getCardArtUrl } from "@/lib/card-art-registry"

const PHOTO_BASE = "/images/cards"

/** Catalog card_id → photo filename */
export const CARD_PHOTO_FILES: Record<string, string> = {
  hdfc_millennia: "hdfc_millenia.jpeg",
  hdfc_regalia: "hdfc_regelia.jpeg",
  hdfc_swiggy: "hdfc_swiggy.jpeg",
  hdfc_freedom: "hdfc_freedom.jpeg",
  axis_flipkart: "axis_flipkart.jpeg",
  axis_magnus: "axis_magnus.jpeg",
  axis_vistara: "axis_vistara.jpeg",
  axis_airtel: "axis_airtel.jpeg",
  sbi_cashback: "sbi_cashback.jpeg",
  sbi_simplyclick: "sbi_simplyclick.jpeg",
  sbi_elite: "sbi_elite.jpeg",
}

export function getCardPhotoUrl(cardId: string): string | null {
  const file = CARD_PHOTO_FILES[cardId]
  if (!file) return null
  return `${PHOTO_BASE}/${file}`
}

export function resolveCardImageUrl(
  cardId: string,
  cardImageUrl?: string | null
): string | null {
  if (cardImageUrl?.trim()) {
    const url = cardImageUrl.trim()
    if (url.startsWith("/images/cards/")) return url
    if (url.startsWith("http")) return url
    return url.startsWith("/") ? url : `/${url}`
  }
  return getCardPhotoUrl(cardId) ?? getCardArtUrl(cardId) ?? CARD_ART[cardId]?.image_url ?? null
}
