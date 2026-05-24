import type { WalletCardRecord } from "@/components/add-card-modal"

const LEGACY_BANK_STYLES: Record<string, string> = {
  HDFC: "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100",
  SBI: "bg-gradient-to-br from-cyan-500 to-blue-700 text-white",
  ICICI: "bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100",
  Axis: "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white",
  AXIS: "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white",
}

const DEFAULT_CARD_STYLE =
  "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200"

export function normalizeWalletCard(item: unknown): WalletCardRecord | null {
  if (typeof item !== "object" || item === null) return null
  const row = item as Record<string, unknown>

  if (
    typeof row.card_id === "string" &&
    typeof row.bank_name === "string" &&
    typeof row.card_name === "string"
  ) {
    return {
      card_id: row.card_id,
      bank_name: row.bank_name,
      card_name: row.card_name,
      style_classes:
        typeof row.style_classes === "string"
          ? row.style_classes
          : DEFAULT_CARD_STYLE,
    }
  }

  if (
    typeof row.id === "string" &&
    typeof row.bank === "string" &&
    typeof row.name === "string" &&
    typeof row.style === "string"
  ) {
    return {
      card_id: row.id,
      bank_name: row.bank,
      card_name: row.name,
      style_classes: row.style,
    }
  }

  if (
    typeof row.id === "string" &&
    typeof row.bank === "string" &&
    typeof row.network === "string"
  ) {
    return {
      card_id: row.id,
      bank_name: row.bank,
      card_name: String(row.network),
      style_classes: LEGACY_BANK_STYLES[row.bank] ?? DEFAULT_CARD_STYLE,
    }
  }

  return null
}

export function parseWalletCards(raw: unknown): WalletCardRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizeWalletCard)
    .filter((card): card is WalletCardRecord => card !== null)
}
