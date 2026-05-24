import { CARD_CATALOG } from "@/lib/card-catalog"

type CardLike = {
  card_id: string
  bank_name: string
  card_name: string
}

const BANK_ALIASES: Record<string, string> = {
  axis: "axis",
  "axis bank": "axis",
  hdfc: "hdfc",
  "hdfc bank": "hdfc",
  icici: "icici",
  "icici bank": "icici",
  sbi: "sbi",
  "sbi card": "sbi",
}

const CARD_ALIASES: Record<string, string> = {
  "amazon pay icici bank credit card": "amazon pay",
  "amazon pay icici bank": "amazon pay",
  "amazon pay icici": "amazon pay",
  "icici amazon pay": "amazon pay",
  "flipkart axis bank credit card": "flipkart axis",
  "flipkart axis bank": "flipkart axis",
  "axis bank flipkart": "flipkart axis",
  "diners club black metal edition": "diners club black",
  "diners black": "diners club black",
  millennia: "millennia",
  "hdfc millennia": "millennia",
}

export function normalizeBankName(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ")
  return BANK_ALIASES[normalized] ?? normalized
}

export function normalizeCardName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\bcredit card\b/g, "")
    .replace(/\bbank\b/g, "")
    .replace(/\s+/g, " ")
    .trim()

  return CARD_ALIASES[normalized] ?? normalized
}

export function cardIdentityKey(card: {
  bank_name: string
  card_name: string
}): string {
  return `${normalizeBankName(card.bank_name)}:${normalizeCardName(card.card_name)}`
}

export function cardsReferToSameCard(a: CardLike, b: CardLike): boolean {
  if (a.card_id && b.card_id && a.card_id === b.card_id) {
    return true
  }

  return cardIdentityKey(a) === cardIdentityKey(b)
}

export function findCatalogMatch(card: CardLike): CardLike | null {
  const byId = CARD_CATALOG.find((row) => row.card_id === card.card_id)
  if (byId) {
    return {
      card_id: byId.card_id,
      bank_name: byId.bank_name,
      card_name: byId.card_name,
    }
  }

  const byName = CARD_CATALOG.find((row) =>
    cardsReferToSameCard(card, row)
  )
  if (!byName) return null

  return {
    card_id: byName.card_id,
    bank_name: byName.bank_name,
    card_name: byName.card_name,
  }
}

export function isCardInWallet(
  catalogCard: CardLike,
  walletCards: CardLike[]
): boolean {
  return walletCards.some((walletCard) =>
    cardsReferToSameCard(walletCard, catalogCard)
  )
}
