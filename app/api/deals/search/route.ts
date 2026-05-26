import { NextResponse } from "next/server"
import { getUserIdFromBearer } from "@/lib/api-auth"
import {
  buildSearchHistoryLabel,
  saveDealSearchHistory,
} from "@/lib/deals-search-history-store"
import {
  parseSearchRequestBody,
  searchDealsForWallet,
} from "@/lib/deal-search-service"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const parsed = await parseSearchRequestBody(body)

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const result = await searchDealsForWallet(
      parsed.category,
      parsed.url,
      parsed.searchCards,
      parsed.overrides
    )

    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim()
    const userId = token ? await getUserIdFromBearer(request) : null

    if (userId && token) {
      try {
        await saveDealSearchHistory(token, userId, {
          category: parsed.category,
          searchLabel: buildSearchHistoryLabel(parsed.category, body),
          requestBody: body,
          resultPayload: result,
        })
      } catch (historyErr) {
        console.warn("[deals/search] history save failed:", historyErr)
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Deal search failed unexpectedly."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
