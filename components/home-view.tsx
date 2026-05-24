"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ArrowRight,
  CreditCard,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DealSearchBar } from "@/components/deal-search-bar"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { useWalletCards } from "@/hooks/useWalletCards"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface HomeViewProps {
  onNavigate: (tab: "deals" | "wallet" | "activity") => void
  onSignIn?: () => void
}

type ProfileStats = {
  total_saved: number
  active_deals_count: number
}

function toCount(value: unknown): number {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0
}

function formatSaved(amount: number): string {
  if (amount <= 0) return "₹0"
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, "")}L`
  }
  if (amount >= 1_000) {
    return `₹${Math.round(amount / 1_000)}K`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function StatCard({
  icon: Icon,
  iconClassName,
  loading,
  value,
  label,
}: {
  icon: typeof TrendingUp
  iconClassName: string
  loading: boolean
  value: number
  label: string
}) {
  const displayValue =
    label === "Saved" ? formatSaved(value) : value.toLocaleString("en-IN")

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/60 p-3 text-center backdrop-blur-md">
      <Icon className={cn("mx-auto mb-2 h-5 w-5", iconClassName)} />
      {loading ? (
        <>
          <Skeleton className="mx-auto mb-2 h-7 w-10 bg-slate-800" />
          <Skeleton className="mx-auto h-3 w-12 bg-slate-800/80" />
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-slate-50">{displayValue}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </>
      )}
    </div>
  )
}

export function HomeView({ onNavigate, onSignIn }: HomeViewProps) {
  const { user, loading: authLoading } = useAuth()
  const { circleCount, loading: profileLoading } = useProfile()
  const { cards, loading: cardsLoading } = useWalletCards(user?.id)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProfileStats>({
    total_saved: 0,
    active_deals_count: 0,
  })

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats({ total_saved: 0, active_deals_count: 0 })
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("total_saved, active_deals_count")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        throw error
      }

      setStats({
        total_saved: toCount(data?.total_saved),
        active_deals_count: toCount(data?.active_deals_count),
      })
    } catch {
      setStats({ total_saved: 0, active_deals_count: 0 })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    void fetchStats()
  }, [authLoading, fetchStats])

  const statsLoading = loading || authLoading || profileLoading || cardsLoading
  const cardCount = user ? cards.length : 0
  const circleMembers = user ? circleCount : 0

  return (
    <div className="px-4 pb-32 pt-2">
      <div className="relative mb-6 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-purple-500/20" />
        <div className="relative p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-emerald-400">
              Welcome to PoolPay
            </span>
          </div>
          <h1 className="mb-2 text-balance text-3xl font-bold text-slate-50">
            Co-Purchase.
            <br />
            <span className="text-emerald-400">Save Together.</span>
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Pool credit cards with your trusted circle to unlock exclusive
            discounts on premium products.
          </p>
        </div>
      </div>

      <DealSearchBar
        onNeedWallet={() => onNavigate("wallet")}
        onNeedSignIn={onSignIn}
      />

      <div className="mb-6 grid grid-cols-3 gap-2">
        <StatCard
          icon={TrendingUp}
          iconClassName="text-emerald-400"
          loading={statsLoading}
          value={stats.total_saved}
          label="Saved"
        />
        <StatCard
          icon={Users}
          iconClassName="text-blue-400"
          loading={statsLoading}
          value={circleMembers}
          label="Circle"
        />
        <StatCard
          icon={Zap}
          iconClassName="text-purple-400"
          loading={statsLoading}
          value={stats.active_deals_count}
          label="Deals"
        />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800/50 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
            <CreditCard className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-50">Wallet cards</p>
            <p className="text-sm text-slate-400">
              {statsLoading ? "…" : `${cardCount} card${cardCount === 1 ? "" : "s"} added`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="mb-3 text-lg font-semibold text-slate-50">Quick Actions</h2>

        <button
          onClick={() => onNavigate("deals")}
          className={cn(
            "group flex w-full items-center justify-between p-4",
            "rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5",
            "transition-all duration-300 hover:border-emerald-500/40"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-50">Browse Live Deals</p>
              <p className="text-sm text-slate-400">
                {stats.active_deals_count} active deal
                {stats.active_deals_count === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-emerald-400 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => onNavigate("wallet")}
          className={cn(
            "group flex w-full items-center justify-between p-4",
            "rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-500/5",
            "transition-all duration-300 hover:border-blue-500/40"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-50">Manage Wallet</p>
              <p className="text-sm text-slate-400">
                {cardCount} card{cardCount === 1 ? "" : "s"} in wallet
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-blue-400 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => onNavigate("activity")}
          className={cn(
            "group flex w-full items-center justify-between p-4",
            "rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-purple-500/5",
            "transition-all duration-300 hover:border-purple-500/40"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-50">View Activity</p>
              <p className="text-sm text-slate-400">
                {stats.active_deals_count} contract
                {stats.active_deals_count === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-purple-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
