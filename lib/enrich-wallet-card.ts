import type { WalletCardRecord } from "@/components/add-card-modal"
import { getCatalogCard, CARD_CATALOG } from "@/lib/card-catalog"
import { resolveCardImageUrl } from "@/lib/card-photo-registry"
import { findCatalogMatch } from "@/lib/card-identity"
import { resolveBankProfile } from "@/lib/bank-registry"

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)
}

/** Resolve wallet rows (often UUID card_id) to catalog slugs + art URLs. */
export function enrichWalletCard(card: WalletCardRecord): WalletCardRecord {
  const match = findCatalogMatch(card)
  const catalog = match ? getCatalogCard(match.card_id) : undefined
  const slug = catalog?.card_id ?? (isUuid(card.card_id) ? null : card.card_id)
  const bank = resolveBankProfile(card.bank_name, card.bank_id)

  return {
    ...card,
    card_id: slug ?? card.card_id,
    bank_id: card.bank_id ?? bank.bank_id,
    bank_name: catalog?.bank_name ?? card.bank_name,
    bank_logo_url:
      card.bank_logo_url ?? catalog?.bank_logo_url ?? bank.logo_url,
    card_image_url:
      card.card_image_url ??
      catalog?.card_image_url ??
      (slug ? resolveCardImageUrl(slug) : null),
    style_classes: catalog?.style_classes ?? card.style_classes,
  }
}

export function enrichWalletCards(cards: WalletCardRecord[]): WalletCardRecord[] {
  return cards.map(enrichWalletCard)
}

export function catalogRowsFromStaticCatalog() {
  return CARD_CATALOG.map((c) => {
    const bank = resolveBankProfile(c.bank_name)
    return {
      card_id: c.card_id,
      bank_id: bank.bank_id,
      bank_name: c.bank_name,
      bank_logo_url: c.bank_logo_url ?? bank.logo_url,
      card_image_url: c.card_image_url ?? resolveCardImageUrl(c.card_id),
      card_name: c.card_name,
      style_classes: c.style_classes,
      network: null,
      card_tier: null,
      apply_url: c.apply_url,
      is_active: true,
    }
  })
}
