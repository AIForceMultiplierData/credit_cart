import type { WalletCardRecord } from "@/components/add-card-modal"
import { resolveCardImageUrl } from "@/lib/card-photo-registry"
import { getBankLogoUrl } from "@/lib/bank-registry"

const LEGACY_BANK_STYLES: Record<string, string> = {
  HDFC: "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100",
  SBI: "bg-gradient-to-br from-cyan-500 to-blue-700 text-white",
  ICICI: "bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100",
  Axis: "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white",
  AXIS: "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white",
}

const DEFAULT_CARD_STYLE =
  "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200"

function parseActiveForLending(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (value === "yes" || value === "true" || value === 1 || value === "1") {
    return true
  }
  return false
}

function withLendingFlag(
  card: Omit<WalletCardRecord, "active_for_lending">,
  row: Record<string, unknown>
): WalletCardRecord {
  return {
    ...card,
    active_for_lending: parseActiveForLending(row.active_for_lending),
  }
}

export function normalizeWalletCard(item: unknown): WalletCardRecord | null {
  if (typeof item !== "object" || item === null) return null
  const row = item as Record<string, unknown>

  if (
    typeof row.card_id === "string" &&
    typeof row.bank_name === "string" &&
    typeof row.card_name === "string"
  ) {
    return withLendingFlag(
      {
        card_id: row.card_id,
        bank_id: typeof row.bank_id === "string" ? row.bank_id : null,
        bank_name: row.bank_name,
        bank_logo_url:
          typeof row.bank_logo_url === "string"
            ? row.bank_logo_url
            : getBankLogoUrl(row.bank_name),
        card_image_url:
          typeof row.card_image_url === "string"
            ? row.card_image_url
            : resolveCardImageUrl(row.card_id),
        card_name: row.card_name,
        style_classes:
          typeof row.style_classes === "string"
            ? row.style_classes
            : DEFAULT_CARD_STYLE,
      },
      row
    )
  }

  if (
    typeof row.id === "string" &&
    typeof row.bank === "string" &&
    typeof row.name === "string" &&
    typeof row.style === "string"
  ) {
    return withLendingFlag(
      {
        card_id: row.id,
        bank_name: row.bank,
        card_name: row.name,
        style_classes: row.style,
      },
      row
    )
  }

  if (
    typeof row.id === "string" &&
    typeof row.bank === "string" &&
    typeof row.network === "string"
  ) {
    return withLendingFlag(
      {
        card_id: row.id,
        bank_name: row.bank,
        card_name: String(row.network),
        style_classes: LEGACY_BANK_STYLES[row.bank] ?? DEFAULT_CARD_STYLE,
      },
      row
    )
  }

  return null
}

export function parseWalletCards(raw: unknown): WalletCardRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizeWalletCard)
    .filter((card): card is WalletCardRecord => card !== null)
}

export function serializeWalletCards(cards: WalletCardRecord[]): WalletCardRecord[] {
  return cards.map((card) => ({
    card_id: card.card_id,
    bank_id: card.bank_id ?? null,
    bank_name: card.bank_name,
    bank_logo_url: card.bank_logo_url ?? null,
    card_image_url: card.card_image_url ?? resolveCardImageUrl(card.card_id),
    card_name: card.card_name,
    style_classes: card.style_classes,
    active_for_lending: Boolean(card.active_for_lending),
  }))
}

export function countLendingActiveCards(cards: WalletCardRecord[]): number {
  return cards.filter((card) => card.active_for_lending).length
}
