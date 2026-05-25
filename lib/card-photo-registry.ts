/**

 * Real card face photos served from public/images/cards/ → /images/cards/...

 *

 * Staging copy (optional): app/public/images/cards/

 * Run: python scripts/crop-card-sheets.py  (syncs app/public → public)

 */



import { CARD_ART, getCardArtUrl } from "@/lib/card-art-registry"



const PHOTO_BASE = "/images/cards"



/**

 * catalog card_id → filename on disk.

 * Filenames may differ slightly from card_id (e.g. millenia vs millennia).

 */

export const CARD_PHOTO_FILES: Record<string, string> = {

  hdfc_millennia: "hdfc_millenia.jpeg",

  hdfc_regalia: "hdfc_regelia.jpeg",

  hdfc_swiggy: "hdfc_swiggy.jpeg",

  hdfc_freedom: "hdfc_freedom.jpeg",

  hdfc_bizgrow: "hdfc_bizgrow.jpeg",

  hdfc_iocl: "hdfc_iocl.webp",

  hdfc_irctc: "hdfc_irctc.webp",

  hdfc_pixel_play: "hdfc_pixel_play.webp",

  axis_flipkart: "axis_flipkart.jpeg",

  axis_magnus: "axis_magnus.jpeg",

  axis_vistara: "axis_vistara.jpeg",

  axis_airtel: "axis_airtel.jpeg",

  sbi_elite: "sbi_elite.jpeg",

  sbi_prime: "sbi_prime.jpeg",

  sbi_simplyclick: "sbi_simplyclick.jpeg",

  sbi_cashback: "sbi_cashback.jpeg",

  icici_amazon: "icici_amazon.jpeg",

  icici_sapphiro: "icici_sapphiro.jpeg",

  icici_coral: "icici_coral.jpeg",

  icici_emeralde: "icici_emeralde.jpeg",

  icici_rubyx: "icici_rubyx.jpeg",

  icici_platinum: "icici_platinum.jpeg",

  icici_mine: "icici_mine.jpeg",

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


