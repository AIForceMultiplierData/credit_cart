"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, IndianRupee, Loader2, Shield } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAIL = "founder@forcemultiplierdata.com"

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

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  const fetchContracts = useCallback(async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase.from("contracts").select("*")

      if (error) {
        throw error
      }

      setContracts((data ?? []) as ContractRow[])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load admin metrics."
      toast.error("Dashboard load failed", { description: message })
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user || !isAdmin) {
      router.replace("/")
      return
    }

    void fetchContracts()
  }, [authLoading, user, isAdmin, router, fetchContracts])

  const metrics = useMemo(() => aggregateContracts(contracts), [contracts])
  const chartData = useMemo(
    () => buildLastSevenDaysSeries(contracts),
    [contracts]
  )

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
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
          <Shield className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Admin Dashboard</h2>
          <p className="text-sm text-slate-400">
            Escrow health and contract velocity
          </p>
        </div>
      </div>

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

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur-md">
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
    </main>
  )
}
