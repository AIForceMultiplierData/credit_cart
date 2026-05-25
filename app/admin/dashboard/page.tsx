"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, IndianRupee, Loader2, RefreshCw, Shield } from "lucide-react"
import { toast } from "sonner"
import { AdminFunnelPanel } from "@/components/admin-funnel-panel"
import { ADMIN_EMAIL, isAdminEmail } from "@/lib/admin-auth"
import type { AdminAnalyticsPayload } from "@/lib/admin-analytics"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

const ACTIVE_STATUSES = new Set([
  "pending_acceptance",
  "escrow_locked",
  "order_placed",
  "disputed",
])

type ContractRow = {
  id: string
  buyer_id: string
  lender_id: string | null
  product_name: string
  base_price: number
  card_discount_amount: number
  escrow_status: string
  created_at: string
}

type DashboardMetrics = {
  totalEscrowLocked: number
  activeContractsCount: number
}

type DailyContractPoint = {
  date: string
  count: number
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getEscrowAmount(contract: ContractRow): number {
  return Math.max(
    toNumber(contract.base_price) - toNumber(contract.card_discount_amount),
    0
  )
}

function aggregateContracts(contracts: ContractRow[]): DashboardMetrics {
  return contracts.reduce<DashboardMetrics>(
    (metrics, contract) => {
      if (contract.escrow_status === "escrow_locked") {
        metrics.totalEscrowLocked += getEscrowAmount(contract)
      }

      if (ACTIVE_STATUSES.has(contract.escrow_status)) {
        metrics.activeContractsCount += 1
      }

      return metrics
    },
    { totalEscrowLocked: 0, activeContractsCount: 0 }
  )
}

function buildLastSevenDaysSeries(contracts: ContractRow[]): DailyContractPoint[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: DailyContractPoint[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)

    const isoDate = day.toISOString().slice(0, 10)
    const label = day.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
    })

    const count = contracts.reduce((total, contract) => {
      const createdDate = contract.created_at.slice(0, 10)
      return createdDate === isoDate ? total + 1 : total
    }, 0)

    days.push({ date: label, count })
  }

  return days
}

function formatDailyLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, session, loading: authLoading } = useAuth()
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [analytics, setAnalytics] = useState<AdminAnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = isAdminEmail(user?.email)

  const fetchDashboard = useCallback(async () => {
    setRefreshing(true)

    try {
      const token = session?.access_token
      if (!token) {
        throw new Error("Missing session token")
      }

      const [contractsRes, analyticsRes] = await Promise.all([
        supabase.from("contracts").select("*"),
        fetch("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (contractsRes.error) {
        throw contractsRes.error
      }

      setContracts((contractsRes.data ?? []) as ContractRow[])

      if (!analyticsRes.ok) {
        const body = (await analyticsRes.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(body.error ?? `Analytics API failed (${analyticsRes.status})`)
      }

      const body = (await analyticsRes.json()) as AdminAnalyticsPayload & { ok?: boolean }
      setAnalytics({
        source: body.source,
        setup_hint: body.setup_hint,
        user_funnel: body.user_funnel,
        contract_funnel: body.contract_funnel,
        contracts_daily: body.contracts_daily ?? [],
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load admin metrics."
      toast.error("Dashboard load failed", { description: message })
      setContracts([])
      setAnalytics(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (authLoading) return

    if (!user || !isAdmin) {
      router.replace("/")
      return
    }

    void fetchDashboard()
  }, [authLoading, user, isAdmin, router, fetchDashboard])

  const metrics = useMemo(() => aggregateContracts(contracts), [contracts])
  const chartData = useMemo(
    () => buildLastSevenDaysSeries(contracts),
    [contracts]
  )

  const semanticDailyChart = useMemo(() => {
    if (!analytics?.contracts_daily.length) return []

    return [...analytics.contracts_daily]
      .reverse()
      .slice(-7)
      .map((row) => ({
        date: formatDailyLabel(row.created_date_key),
        requested: row.contracts_requested,
        pending: row.pending,
        approved: row.approved,
        sla24: row.sla_24h_breach,
      }))
  }, [analytics?.contracts_daily])

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 pb-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Admin Dashboard</h2>
            <p className="text-sm text-slate-400">
              Escrow health, funnels, and contract velocity
            </p>
            {analytics?.source === "computed_fallback" ? (
              <p className="mt-1 text-xs text-amber-400/90">
                Funnels computed from live data — extended analytics views not enabled yet.
              </p>
            ) : analytics?.source === "analytics_views" ? (
              <p className="mt-1 text-xs text-emerald-400/80">
                Funnels loaded from analytics semantic layer.
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={() => void fetchDashboard()}
          className="border-slate-700 text-slate-300"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {analytics ? (
        <AdminFunnelPanel
          userFunnel={analytics.user_funnel}
          contractFunnel={analytics.contract_funnel}
        />
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <IndianRupee className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium">Total Escrow Locked (INR)</span>
          </div>
          <p className="text-3xl font-bold text-slate-50">
            ₹{metrics.totalEscrowLocked.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Sum of escrow_locked contract values
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">Active Contracts Count</span>
          </div>
          <p className="text-3xl font-bold text-slate-50">
            {metrics.activeContractsCount.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Pending, locked, placed, or disputed
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur-md">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-50">
            Contracts Created Over Last 7 Days
          </h3>
          <p className="text-sm text-slate-400">
            Daily contract creation volume
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [value, "Contracts"]}
              />
              <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {semanticDailyChart.length > 0 ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-50">
              Semantic layer — contract pipeline (7 days)
            </h3>
            <p className="text-sm text-slate-400">
              Requested vs pending vs approved vs 24h SLA breaches
            </p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semanticDailyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "0.75rem",
                    color: "#f8fafc",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar dataKey="requested" name="Requested" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sla24" name="SLA 24h+" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-600">
        Admin access: {ADMIN_EMAIL}
      </p>
    </main>
  )
}
