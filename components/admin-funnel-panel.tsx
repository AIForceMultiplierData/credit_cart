"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowDown, Users, FileCheck } from "lucide-react"
import type {
  ContractFunnelMetrics,
  UserFunnelMetrics,
} from "@/lib/admin-analytics"
import { cn } from "@/lib/utils"

type FunnelStep = {
  key: string
  label: string
  count: number
  pctOfTop: number | null
  pctOfPrevious: number | null
  tone: "emerald" | "blue" | "violet" | "amber" | "rose"
}

function buildUserSteps(funnel: UserFunnelMetrics): FunnelStep[] {
  const top = Math.max(funnel.google_login_users, 1)

  const steps: Array<Omit<FunnelStep, "pctOfTop" | "pctOfPrevious">> = [
    {
      key: "google",
      label: "Google login",
      count: funnel.google_login_users,
      tone: "blue",
    },
    {
      key: "card",
      label: "Added wallet card",
      count: funnel.users_with_card,
      tone: "emerald",
    },
    {
      key: "buyer",
      label: "Active buyer (pinged deal)",
      count: funnel.active_buyers,
      tone: "violet",
    },
    {
      key: "free",
      label: "Free user (buys, never lends)",
      count: funnel.free_users,
      tone: "amber",
    },
  ]

  return steps.map((step, index) => {
    const prev = index === 0 ? top : steps[index - 1].count
    return {
      ...step,
      pctOfTop:
        top > 0 ? Math.round((1000 * step.count) / top) / 10 : null,
      pctOfPrevious:
        prev > 0 ? Math.round((1000 * step.count) / prev) / 10 : null,
    }
  })
}

function buildContractSteps(funnel: ContractFunnelMetrics): FunnelStep[] {
  const top = Math.max(funnel.contracts_requested, 1)

  const steps: Array<Omit<FunnelStep, "pctOfTop" | "pctOfPrevious">> = [
    {
      key: "requested",
      label: "Contracts requested",
      count: funnel.contracts_requested,
      tone: "blue",
    },
    {
      key: "pending",
      label: "Pending approval",
      count: funnel.pending_approval,
      tone: "amber",
    },
    {
      key: "approved",
      label: "Approved (lender accepted)",
      count: funnel.approved,
      tone: "emerald",
    },
    {
      key: "pending24",
      label: "Pending > 24 hours",
      count: funnel.pending_over_24h,
      tone: "rose",
    },
    {
      key: "pending48",
      label: "Pending > 48 hours",
      count: funnel.pending_over_48h,
      tone: "rose",
    },
  ]

  return steps.map((step, index) => {
    const prev = index === 0 ? top : steps[index - 1].count
    return {
      ...step,
      pctOfTop:
        top > 0 ? Math.round((1000 * step.count) / top) / 10 : null,
      pctOfPrevious:
        prev > 0 ? Math.round((1000 * step.count) / prev) / 10 : null,
    }
  })
}

const BAR_COLORS: Record<FunnelStep["tone"], string> = {
  emerald: "#34d399",
  blue: "#60a5fa",
  violet: "#a78bfa",
  amber: "#fbbf24",
  rose: "#fb7185",
}

function FunnelBars({ steps, title, icon }: { steps: FunnelStep[]; title: string; icon: React.ReactNode }) {
  const chartData = steps.map((s) => ({
    name: s.label,
    count: s.count,
    fill: BAR_COLORS[s.tone],
  }))

  const maxCount = Math.max(...steps.map((s) => s.count), 1)

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur-md">
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
          <p className="text-xs text-slate-500">Live counts from semantic layer</p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {steps.map((step, index) => (
          <div key={step.key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-200">{step.label}</span>
              <span className="shrink-0 tabular-nums text-slate-400">
                {step.count.toLocaleString("en-IN")}
                {step.pctOfTop !== null ? (
                  <span className="ml-2 text-xs text-slate-500">
                    ({step.pctOfTop}% of top)
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  step.tone === "emerald" && "bg-emerald-400",
                  step.tone === "blue" && "bg-blue-400",
                  step.tone === "violet" && "bg-violet-400",
                  step.tone === "amber" && "bg-amber-400",
                  step.tone === "rose" && "bg-rose-400"
                )}
                style={{
                  width: `${Math.max((step.count / maxCount) * 100, step.count > 0 ? 4 : 0)}%`,
                }}
              />
            </div>
            {index < steps.length - 1 ? (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                <ArrowDown className="h-3 w-3" aria-hidden />
                {steps[index + 1].pctOfPrevious !== null
                  ? `${steps[index + 1].pctOfPrevious}% convert to next step`
                  : "—"}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
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
              formatter={(value: number) => [value.toLocaleString("en-IN"), "Count"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

type AdminFunnelPanelProps = {
  userFunnel: UserFunnelMetrics
  contractFunnel: ContractFunnelMetrics
}

export function AdminFunnelPanel({
  userFunnel,
  contractFunnel,
}: AdminFunnelPanelProps) {
  const userSteps = buildUserSteps(userFunnel)
  const contractSteps = buildContractSteps(contractFunnel)

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <FunnelBars
        title="User lifecycle funnel"
        icon={<Users className="h-5 w-5 text-blue-400" />}
        steps={userSteps}
      />
      <FunnelBars
        title="Contract lifecycle funnel"
        icon={<FileCheck className="h-5 w-5 text-emerald-400" />}
        steps={contractSteps}
      />

      <div className="xl:col-span-2 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Earning mode</p>
          <p className="text-xl font-bold text-slate-50">
            {userFunnel.earning_mode_users}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Lenders</p>
          <p className="text-xl font-bold text-slate-50">
            {userFunnel.behavioral_lenders}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Completed</p>
          <p className="text-xl font-bold text-slate-50">
            {contractFunnel.completed}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Approval rate</p>
          <p className="text-xl font-bold text-emerald-400">
            {contractFunnel.approval_rate_pct ?? "—"}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Pending 24h+</p>
          <p className="text-xl font-bold text-amber-400">
            {contractFunnel.pending_over_24h}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg pending hrs</p>
          <p className="text-xl font-bold text-rose-400">
            {contractFunnel.avg_pending_age_hours ?? "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
