import { NextResponse } from "next/server"
import { getUserIdFromBearer } from "@/lib/api-auth"
import { loadDealSearchHistory } from "@/lib/deals-search-history-store"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromBearer(request)
    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim()

    if (!userId || !token) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 })
    }

    const url = new URL(request.url)
    const limitRaw = Number(url.searchParams.get("limit") ?? "20")
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20

    const history = await loadDealSearchHistory(token, userId, limit)
    return NextResponse.json({ history })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load search history."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
