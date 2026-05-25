"use client"

import { useCallback, useEffect, useState } from "react"
import { CreditCard, Sparkles, TrendingUp, Users, Zap } from "lucide-react"
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

function StatTile({
  icon: Icon,
  iconClassName,
  loading,
  value,
  label,
  formatValue,
}: {
  icon: typeof TrendingUp
  iconClassName: string
  loading: boolean
  value: number
  label: string
  formatValue?: (n: number) => string
}) {
  const displayValue = formatValue
    ? formatValue(value)
    : value.toLocaleString("en-IN")

  return (
    <div className="flex h-full min-h-[4.75rem] w-full flex-col items-center justify-center rounded-xl border border-slate-800/50 bg-slate-900/60 px-2 py-3 text-center backdrop-blur-md">
      <Icon className={cn("mb-1 h-3.5 w-3.5 shrink-0", iconClassName)} />
      {loading ? (
        <>
          <Skeleton className="mb-1 h-4 w-8 bg-slate-800" />
          <Skeleton className="h-2.5 w-12 bg-slate-800/80" />
        </>
      ) : (
        <>
          <p className="text-sm font-bold leading-none text-slate-50">
            {displayValue}
          </p>
          <p className="mt-1 text-[10px] leading-none text-slate-500">{label}</p>
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

      <div className="mb-6 grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatTile
          icon={TrendingUp}
          iconClassName="text-emerald-400"
          loading={statsLoading}
          value={stats.total_saved}
          label="Saved"
          formatValue={formatSaved}
        />
        <StatTile
          icon={Users}
          iconClassName="text-blue-400"
          loading={statsLoading}
          value={circleMembers}
          label="Circle"
        />
        <StatTile
          icon={Zap}
          iconClassName="text-purple-400"
          loading={statsLoading}
          value={stats.active_deals_count}
          label="Deals"
        />
        <button
          type="button"
          onClick={() => onNavigate("wallet")}
          className="flex h-full w-full min-w-0 text-left transition-opacity hover:opacity-90 active:scale-[0.98]"
          aria-label="Open wallet"
        >
          <StatTile
            icon={CreditCard}
            iconClassName="text-blue-400"
            loading={statsLoading}
            value={cardCount}
            label="Wallet"
          />
        </button>
      </div>
    </div>
  )
}
