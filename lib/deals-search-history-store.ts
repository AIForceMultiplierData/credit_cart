import { createClient } from "@supabase/supabase-js"
import type { DealSearchCategory, DealSearchResult } from "@/lib/deal-search"

export type DealSearchHistoryEntry = {
  id: string
  category: DealSearchCategory
  search_label: string
  request_body: Record<string, unknown>
  result_payload: DealSearchResult
  created_at: string
}

type HistoryRow = {
  id: string
  category: string
  search_label: string
  request_body: Record<string, unknown>
  result_payload: DealSearchResult
  created_at: string
}

function supabaseForUser(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Supabase is not configured.")
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

function rowToEntry(row: HistoryRow): DealSearchHistoryEntry {
  return {
    id: row.id,
    category: row.category as DealSearchCategory,
    search_label: row.search_label,
    request_body: row.request_body ?? {},
    result_payload: row.result_payload,
    created_at: row.created_at,
  }
}

export async function saveDealSearchHistory(
  accessToken: string,
  userId: string,
  input: {
    category: DealSearchCategory
    searchLabel: string
    requestBody: Record<string, unknown>
    resultPayload: DealSearchResult
  }
): Promise<void> {
  const supabase = supabaseForUser(accessToken)
  const { error } = await supabase.from("deals_search_history").insert({
    user_id: userId,
    category: input.category,
    search_label: input.searchLabel.slice(0, 240),
    request_body: input.requestBody,
    result_payload: input.resultPayload,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export function buildSearchHistoryLabel(
  category: DealSearchCategory,
  body: Record<string, unknown>
): string {
  if (category === "product") {
    const ps = body.productSearch as { query?: string } | undefined
    return String(ps?.query ?? "Product search").trim() || "Product search"
  }
  if (category === "flight") {
    const fs = body.flightSearch as {
      origin?: string
      destination?: string
    } | undefined
    const o = fs?.origin?.trim()
    const d = fs?.destination?.trim()
    if (o && d) return `${o} → ${d}`
    return "Flight search"
  }
  const hs = body.hotelSearch as { city?: string } | undefined
  return String(hs?.city ?? "Hotel search").trim() || "Hotel search"
}

export async function loadDealSearchHistory(
  accessToken: string,
  userId: string,
  limit = 20
): Promise<DealSearchHistoryEntry[]> {
  const supabase = supabaseForUser(accessToken)
  const { data, error } = await supabase
    .from("deals_search_history")
    .select(
      "id, category, search_label, request_body, result_payload, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data as HistoryRow[] | null)?.map(rowToEntry) ?? []
}
