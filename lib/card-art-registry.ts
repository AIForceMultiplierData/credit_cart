/** Polished card face images (public/cards) keyed by catalog card_id / card_slug */

export type CardArtEntry = {
  image_url: string
  /** Optional accent for fallback gradient */
  accent?: string
}

export const CARD_ART: Record<string, CardArtEntry> = {
  hdfc_millennia: { image_url: "/cards/hdfc_millennia.svg", accent: "#004C8F" },
  hdfc_regalia: { image_url: "/cards/hdfc_regalia.svg", accent: "#C9A227" },
  hdfc_diners: { image_url: "/cards/hdfc_diners.svg", accent: "#1a1a1a" },
  hdfc_swiggy: { image_url: "/cards/hdfc_swiggy.svg", accent: "#F97316" },
  hdfc_tata_neu: { image_url: "/cards/hdfc_tata_neu.svg", accent: "#6B21A8" },
  hdfc_freedom: { image_url: "/cards/hdfc_freedom.svg", accent: "#004C8F" },
  hdfc_bizgrow: { image_url: "/cards/hdfc_bizgrow.svg", accent: "#1e3a8a" },
  hdfc_iocl: { image_url: "/cards/hdfc_iocl.svg", accent: "#D97706" },
  hdfc_irctc: { image_url: "/cards/hdfc_irctc.svg", accent: "#0284C7" },
  hdfc_pixel_play: { image_url: "/cards/hdfc_pixel_play.svg", accent: "#06B6D4" },
  sbi_elite: { image_url: "/cards/sbi_elite.svg", accent: "#1e3a5f" },
  sbi_prime: { image_url: "/cards/sbi_prime.svg", accent: "#0f766e" },
  sbi_cashback: { image_url: "/cards/sbi_cashback.svg", accent: "#0096D6" },
  sbi_simplyclick: { image_url: "/cards/sbi_simplyclick.svg", accent: "#0D9488" },
  icici_amazon: { image_url: "/cards/icici_amazon.svg", accent: "#F37021" },
  icici_sapphiro: { image_url: "/cards/icici_sapphiro.svg", accent: "#475569" },
  icici_coral: { image_url: "/cards/icici_coral.svg", accent: "#EA580C" },
  icici_emeralde: { image_url: "/cards/icici_emeralde.svg", accent: "#059669" },
  icici_rubyx: { image_url: "/cards/icici_rubyx.svg", accent: "#BE123C" },
  axis_flipkart: { image_url: "/cards/axis_flipkart.svg", accent: "#971237" },
  axis_magnus: { image_url: "/cards/axis_magnus.svg", accent: "#7f1d1d" },
  axis_vistara: { image_url: "/cards/axis_vistara.svg", accent: "#5B21B6" },
  axis_airtel: { image_url: "/cards/axis_airtel.svg", accent: "#E11D48" },
}

export function getCardArtUrl(
  cardId: string,
  cardImageUrl?: string | null
): string | null {
  if (cardImageUrl?.trim()) return cardImageUrl.trim()
  return CARD_ART[cardId]?.image_url ?? null
}

