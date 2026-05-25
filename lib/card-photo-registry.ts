/**
 * Real card face photos served from public/images/cards/ → /images/cards/...
 * Staging: app/public/images/cards/ — run: python scripts/crop-card-sheets.py
 */

import { CARD_ART, getCardArtUrl } from "@/lib/card-art-registry"

const PHOTO_BASE = "/images/cards"

/** catalog card_slug → filename on disk */
export const CARD_PHOTO_FILES: Record<string, string> = {
  hdfc_millennia: "hdfc_millenia.jpeg",
  hdfc_regalia_gold: "hdfc_regelia.jpeg",
  hdfc_swiggy: "hdfc_swiggy.jpeg",
  hdfc_freedom: "hdfc_freedom.jpeg",
  hdfc_indianoil: "hdfc_iocl.webp",
  hdfc_irctc: "hdfc_irctc.webp",
  hdfc_pixel_play: "hdfc_pixel_play.webp",
  sbi_elite: "sbi_elite.jpeg",
  sbi_prime: "sbi_prime.jpeg",
  sbi_simplyclick: "sbi_simplyclick.jpeg",
  sbi_simplysave: "sbi_cashback.jpeg",
  icici_amazon_pay: "icici_amazon.jpeg",
  icici_sapphiro: "icici_sapphiro.jpeg",
  icici_coral: "icici_coral.jpeg",
  icici_emeralde_private: "icici_emeralde.jpeg",
  icici_rubyx: "icici_rubyx.jpeg",
  icici_mmt_signature: "icici_mmt_signature.jpeg",
  icici_hpcl_super_saver: "icici_hpcl.jpeg",
  axis_my_zone: "axis_flipkart.jpeg",
  axis_magnus: "axis_magnus.jpeg",
  axis_vistara_infinite: "axis_vistara.jpeg",
  axis_airtel: "axis_airtel.jpeg",
}

export function getCardPhotoUrl(cardId: string): string | null {
  const file = CARD_PHOTO_FILES[cardId]
  if (!file) return null
  return `${PHOTO_BASE}/${file}`
}

/** Prefer real photos over legacy Supabase SVG paths (/cards/*.svg). */
export function resolveCardImageUrl(
  cardId: string,
  cardImageUrl?: string | null
): string | null {
  const photo = getCardPhotoUrl(cardId)
  if (photo) return photo

  const raw = cardImageUrl?.trim()
  if (raw) {
    if (raw.startsWith("/images/cards/")) return raw
    if (raw.startsWith("http")) return raw
    if (raw.startsWith("/cards/") && raw.endsWith(".svg")) {
      return getCardArtUrl(cardId) ?? raw
    }
    return raw.startsWith("/") ? raw : `/${raw}`
  }

  return getCardArtUrl(cardId) ?? CARD_ART[cardId]?.image_url ?? null
}
