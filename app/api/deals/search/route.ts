import { NextResponse } from "next/server"
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

    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Deal search failed unexpectedly."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
