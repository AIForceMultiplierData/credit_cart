import { createClient } from "@supabase/supabase-js"
import type { DealAvailability } from "@/lib/deal-availability"
import type { ViralDeal, ViralDealsResult } from "@/lib/viral-deals"

export type DealsFeedFilter = "all" | DealAvailability

type FeedRow = {
  deal_key: string
  availability: DealAvailability
  deal_payload: ViralDeal
  used_serper: boolean
  fetched_at: string
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

function rowToDeal(row: FeedRow): ViralDeal {
  const payload = row.deal_payload
  return {
    ...payload,
    id: payload.id ?? row.deal_key,
    availability: row.availability,
  }
}

function buildSummary(
  total: number,
  ping: number,
  circle: number,
  wallet: number
): string {
  if (total === 0) {
    return "Add a card to your wallet to unlock AI-curated deals."
  }
  return `${total} deals · ${ping} ping to split · ${circle} circle · ${wallet} wallet`
}

export async function saveDealsLiveFeed(
  accessToken: string,
  userId: string,
  result: ViralDealsResult
): Promise<void> {
  const client = supabaseForUser(accessToken)
  const fetchedAt = new Date().toISOString()

  const { error: deleteError } = await client
    .from("deals_live_feed")
    .delete()
    .eq("user_id", userId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (result.deals.length === 0) return

  const rows = result.deals.map((deal) => ({
    user_id: userId,
    deal_key: deal.id,
    availability: deal.availability,
    deal_payload: deal,
    used_serper: result.used_serper,
    fetched_at: fetchedAt,
  }))

  const { error: insertError } = await client
    .from("deals_live_feed")
    .insert(rows)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function loadDealsLiveFeed(
  accessToken: string,
  userId: string,
  filter: DealsFeedFilter
): Promise<ViralDealsResult | null> {
  const client = supabaseForUser(accessToken)

  const { data, error } = await client
    .from("deals_live_feed")
    .select("deal_key, availability, deal_payload, used_serper, fetched_at")
    .eq("user_id", userId)
    .order("fetched_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.length) return null

  const rows = data as FeedRow[]
  const allDeals = rows.map(rowToDeal)
  const usedSerper = rows.some((r) => r.used_serper)

  const ping = allDeals.filter((d) => d.availability === "ping_to_split").length
  const circle = allDeals.filter((d) => d.availability === "circle").length
  const wallet = allDeals.filter((d) => d.availability === "wallet").length

  const deals =
    filter === "all"
      ? allDeals
      : allDeals.filter((d) => d.availability === filter)

  return {
    deals,
    used_serper: usedSerper,
    wallet_excluded_count: 0,
    circle_count: circle,
    summary: buildSummary(allDeals.length, ping, circle, wallet),
    counts: {
      total: allDeals.length,
      ping,
      circle,
      wallet,
    },
  }
}
