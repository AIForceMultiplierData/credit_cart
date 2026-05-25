import type { SupabaseClient } from "@supabase/supabase-js"

export type UserFunnelMetrics = {
  google_login_users: number
  users_with_card: number
  active_buyers: number
  free_users: number
  earning_mode_users: number
  behavioral_lenders: number
  total_profiles: number
  google_to_card_pct: number | null
  card_to_buyer_pct: number | null
  buyer_to_free_user_pct: number | null
}

export type ContractFunnelMetrics = {
  contracts_requested: number
  pending_approval: number
  approved: number
  completed: number
  cancelled: number
  disputed: number
  pending_over_24h: number
  pending_over_48h: number
  approval_rate_pct: number | null
  pending_24h_pct_of_pending: number | null
  pending_48h_pct_of_pending: number | null
  avg_pending_age_hours: number | null
}

export type ContractsDailyPoint = {
  created_date_key: string
  contracts_requested: number
  pending: number
  approved: number
  sla_24h_breach: number
}

export type AdminAnalyticsPayload = {
  source: "analytics_views" | "computed_fallback"
  user_funnel: UserFunnelMetrics
  contract_funnel: ContractFunnelMetrics
  contracts_daily: ContractsDailyPoint[]
  setup_hint: string | null
}

type ProfileRow = {
  id: string
  cards: unknown
}

type ContractRow = {
  buyer_id: string
  lender_id: string | null
  escrow_status: string
  created_at: string
}

function toInt(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : 0
}

function toPct(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((1000 * numerator) / denominator) / 10
}

function hasLendingCard(cards: unknown): boolean {
  if (!Array.isArray(cards)) return false
  return cards.some((item) => {
    if (typeof item !== "object" || item === null) return false
    const row = item as Record<string, unknown>
    if (typeof row.active_for_lending === "boolean") return row.active_for_lending
    const raw = String(row.active_for_lending ?? "").toLowerCase()
    return raw === "true" || raw === "1" || raw === "yes"
  })
}

function walletCardCount(cards: unknown): number {
  if (!Array.isArray(cards)) return 0
  return cards.filter((item) => {
    if (typeof item !== "object" || item === null) return false
    const row = item as Record<string, unknown>
    return typeof row.card_id === "string" || typeof row.id === "string"
  }).length
}

async function countGoogleUsers(admin: SupabaseClient): Promise<number> {
  let page = 1
  let total = 0
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data.users.length) break

    for (const user of data.users) {
      const identities = user.identities ?? []
      if (identities.some((id) => id.provider === "google")) {
        total += 1
      }
    }

    if (data.users.length < perPage) break
    page += 1
    if (page > 50) break
  }

  return total
}

async function fetchFromAnalyticsViews(
  admin: SupabaseClient
): Promise<AdminAnalyticsPayload | null> {
  const analytics = admin.schema("analytics")

  const [userRes, contractRes, dailyRes] = await Promise.all([
    analytics.from("v_user_funnel").select("*").maybeSingle(),
    analytics.from("v_contract_funnel").select("*").maybeSingle(),
    analytics
      .from("v_contracts_daily")
      .select("*")
      .order("created_date_key", { ascending: false })
      .limit(14),
  ])

  if (userRes.error || contractRes.error || dailyRes.error) {
    return null
  }

  if (!userRes.data || !contractRes.data) {
    return null
  }

  const u = userRes.data as Record<string, unknown>
  const c = contractRes.data as Record<string, unknown>

  return {
    source: "analytics_views",
    setup_hint: null,
    user_funnel: {
      google_login_users: toInt(u.google_login_users),
      users_with_card: toInt(u.users_with_card),
      active_buyers: toInt(u.active_buyers),
      free_users: toInt(u.free_users),
      earning_mode_users: toInt(u.earning_mode_users),
      behavioral_lenders: toInt(u.behavioral_lenders),
      total_profiles: toInt(u.total_profiles),
      google_to_card_pct: toPct(u.google_to_card_pct),
      card_to_buyer_pct: toPct(u.card_to_buyer_pct),
      buyer_to_free_user_pct: toPct(u.buyer_to_free_user_pct),
    },
    contract_funnel: {
      contracts_requested: toInt(c.contracts_requested),
      pending_approval: toInt(c.pending_approval),
      approved: toInt(c.approved),
      completed: toInt(c.completed),
      cancelled: toInt(c.cancelled),
      disputed: toInt(c.disputed),
      pending_over_24h: toInt(c.pending_over_24h),
      pending_over_48h: toInt(c.pending_over_48h),
      approval_rate_pct: toPct(c.approval_rate_pct),
      pending_24h_pct_of_pending: toPct(c.pending_24h_pct_of_pending),
      pending_48h_pct_of_pending: toPct(c.pending_48h_pct_of_pending),
      avg_pending_age_hours: (() => {
        const n = Number(c.avg_pending_age_hours)
        return Number.isFinite(n) ? Math.round(n * 10) / 10 : null
      })(),
    },
    contracts_daily: (dailyRes.data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        created_date_key: String(r.created_date_key ?? ""),
        contracts_requested: toInt(r.contracts_requested),
        pending: toInt(r.pending),
        approved: toInt(r.approved),
        sla_24h_breach: toInt(r.sla_24h_breach),
      }
    }),
  }
}

export async function loadAdminAnalytics(
  admin: SupabaseClient
): Promise<AdminAnalyticsPayload> {
  const fromViews = await fetchFromAnalyticsViews(admin)
  if (fromViews) return fromViews

  const [profilesRes, contractsRes, googleCount] = await Promise.all([
    admin.from("profiles").select("id, cards"),
    admin.from("contracts").select("buyer_id, lender_id, escrow_status, created_at"),
    countGoogleUsers(admin),
  ])

  const profiles = (profilesRes.data ?? []) as ProfileRow[]
  const contracts = (contractsRes.data ?? []) as ContractRow[]

  const buyerIds = new Set(contracts.map((c) => c.buyer_id))
  const lenderIds = new Set(
    contracts.map((c) => c.lender_id).filter((id): id is string => Boolean(id))
  )

  let usersWithCard = 0
  let earningModeUsers = 0

  for (const profile of profiles) {
    const count = walletCardCount(profile.cards)
    if (count > 0) usersWithCard += 1
    if (hasLendingCard(profile.cards)) earningModeUsers += 1
  }

  let freeUsers = 0
  for (const profile of profiles) {
    const count = walletCardCount(profile.cards)
    if (count === 0) continue
    if (!buyerIds.has(profile.id)) continue
    if (hasLendingCard(profile.cards)) continue
    if (lenderIds.has(profile.id)) continue
    freeUsers += 1
  }

  const now = Date.now()
  const ms24 = 24 * 60 * 60 * 1000
  const ms48 = 48 * 60 * 60 * 1000

  let pendingApproval = 0
  let approved = 0
  let completed = 0
  let cancelled = 0
  let disputed = 0
  let pendingOver24h = 0
  let pendingOver48h = 0
  let pendingAgeSum = 0

  const dailyMap = new Map<
    string,
    { requested: number; pending: number; approved: number; sla24: number }
  >()

  for (const contract of contracts) {
    const created = new Date(contract.created_at).getTime()
    const ageHours = (now - created) / (60 * 60 * 1000)
    const dateKey = contract.created_at.slice(0, 10)

    const day =
      dailyMap.get(dateKey) ?? {
        requested: 0,
        pending: 0,
        approved: 0,
        sla24: 0,
      }
    day.requested += 1

    const isPending = contract.escrow_status === "pending_acceptance"
    const isApproved =
      contract.lender_id !== null &&
      ["escrow_locked", "order_placed", "completed"].includes(
        contract.escrow_status
      )

    if (isPending) {
      pendingApproval += 1
      day.pending += 1
      pendingAgeSum += ageHours
      if (now - created >= ms24) {
        pendingOver24h += 1
        day.sla24 += 1
      }
      if (now - created >= ms48) pendingOver48h += 1
    }

    if (isApproved) {
      approved += 1
      day.approved += 1
    }
    if (contract.escrow_status === "completed") completed += 1
    if (contract.escrow_status === "cancelled") cancelled += 1
    if (contract.escrow_status === "disputed") disputed += 1

    dailyMap.set(dateKey, day)
  }

  const activeBuyers = buyerIds.size
  const totalProfiles = profiles.length

  const contractsDaily = [...dailyMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 14)
    .map(([created_date_key, d]) => ({
      created_date_key,
      contracts_requested: d.requested,
      pending: d.pending,
      approved: d.approved,
      sla_24h_breach: d.sla24,
    }))

  return {
    source: "computed_fallback",
    setup_hint:
      "Extended analytics views are not enabled yet.",
    user_funnel: {
      google_login_users: googleCount,
      users_with_card: usersWithCard,
      active_buyers: activeBuyers,
      free_users: freeUsers,
      earning_mode_users: earningModeUsers,
      behavioral_lenders: lenderIds.size,
      total_profiles: totalProfiles,
      google_to_card_pct: pct(usersWithCard, googleCount),
      card_to_buyer_pct: pct(activeBuyers, usersWithCard),
      buyer_to_free_user_pct: pct(freeUsers, activeBuyers),
    },
    contract_funnel: {
      contracts_requested: contracts.length,
      pending_approval: pendingApproval,
      approved,
      completed,
      cancelled,
      disputed,
      pending_over_24h: pendingOver24h,
      pending_over_48h: pendingOver48h,
      approval_rate_pct: pct(approved, contracts.length),
      pending_24h_pct_of_pending: pct(pendingOver24h, pendingApproval),
      pending_48h_pct_of_pending: pct(pendingOver48h, pendingApproval),
      avg_pending_age_hours:
        pendingApproval > 0
          ? Math.round((pendingAgeSum / pendingApproval) * 10) / 10
          : null,
    },
    contracts_daily: contractsDaily,
  }
}
