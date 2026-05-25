import { NextResponse } from "next/server"
import { getUserIdFromBearer } from "@/lib/api-auth"
import {
  loadDealsLiveFeed,
  saveDealsLiveFeed,
  type DealsFeedFilter,
} from "@/lib/deals-live-feed-store"
import type { SearchCardInput } from "@/lib/deal-search"
import { fetchViralDeals } from "@/lib/viral-deals-service"

export const runtime = "nodejs"
export const maxDuration = 45

const FEED_LIMIT = 120

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

function parseFilter(raw: unknown): DealsFeedFilter {
  if (raw === "ping_to_split" || raw === "circle" || raw === "wallet") {
    return raw
  }
  return "all"
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    const userId = token ? await getUserIdFromBearer(request) : null

    const body = (await request.json()) as Record<string, unknown>
    const rawSearch = Array.isArray(body.searchCards) ? body.searchCards : []
    const searchCards = rawSearch
      .map(parseSearchCard)
      .filter((card): card is SearchCardInput => card !== null)

    const filter = parseFilter(body.availability)
    const refresh = body.refresh === true

    if (userId && token && !refresh) {
      try {
        const cached = await loadDealsLiveFeed(token, userId, filter)
        if (cached && cached.deals.length > 0) {
          return NextResponse.json({ ...cached, from_cache: true })
        }
      } catch (cacheErr) {
        const message =
          cacheErr instanceof Error ? cacheErr.message : "Cache read failed"
        if (/deals_live_feed|does not exist|schema cache/i.test(message)) {
          /* table missing — fall through to live fetch */
        } else {
          throw cacheErr
        }
      }
    }

    const result = await fetchViralDeals(searchCards, FEED_LIMIT)

    if (userId && token) {
      try {
        await saveDealsLiveFeed(token, userId, result)
      } catch (saveErr) {
        console.warn("[deals/viral] cache save skipped:", saveErr)
      }
    }

    const filtered =
      filter === "all"
        ? result
        : {
            ...result,
            deals: result.deals.filter((d) => d.availability === filter),
          }

    return NextResponse.json({ ...filtered, from_cache: false })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load viral deals."
    return NextResponse.json({ error: message, deals: [] }, { status: 500 })
  }
}
