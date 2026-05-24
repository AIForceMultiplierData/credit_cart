import { NextResponse } from "next/server"
import type { SearchCardInput } from "@/lib/deal-search"
import { fetchViralDeals } from "@/lib/viral-deals-service"

export const runtime = "nodejs"
export const maxDuration = 45

function parseSearchCard(item: unknown): SearchCardInput | null {
  if (typeof item !== "object" || item === null) return null
  const row = item as Record<string, unknown>

  const cardId =
    typeof row.card_id === "string"
      ? row.card_id
      : typeof row.id === "string"
        ? row.id
        : null

  const bankName =
    typeof row.bank_name === "string"
      ? row.bank_name
      : typeof row.bank === "string"
        ? row.bank
        : null

  const cardName =
    typeof row.card_name === "string"
      ? row.card_name
      : typeof row.name === "string"
        ? row.name
        : null

  if (!cardId || !bankName || !cardName) return null

  return {
    card_id: cardId,
    bank_name: bankName,
    card_name: cardName,
    source: row.source === "circle" ? "circle" : "wallet",
    owner_user_id:
      typeof row.owner_user_id === "string" ? row.owner_user_id : undefined,
    owner_name:
      typeof row.owner_name === "string" ? row.owner_name : undefined,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const rawSearch = Array.isArray(body.searchCards) ? body.searchCards : []

    const searchCards = rawSearch
      .map(parseSearchCard)
      .filter((card): card is SearchCardInput => card !== null)

    const result = await fetchViralDeals(searchCards)

    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load viral deals."
    return NextResponse.json({ error: message, deals: [] }, { status: 500 })
  }
}
