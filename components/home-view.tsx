"use client"

import { useCallback, useEffect, useState } from "react"
import { CreditCard, TrendingUp, Users, Zap } from "lucide-react"
import { HomeHeroBanner } from "@/components/home-hero-banner"
import { DEFAULT_SEARCH_CATEGORY } from "@/lib/search-category-rules"
import type { DealSearchCategory } from "@/lib/deal-search"
import { setDealsTabFilter } from "@/lib/deals-nav"
import { Skeleton } from "@/components/ui/skeleton"
import type { Deal } from "@/components/deals-feed"
import { DealSearchBar } from "@/components/deal-search-bar"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { useWalletCards } from "@/hooks/useWalletCards"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface HomeViewProps {
  onNavigate: (tab: "deals" | "wallet" | "activity") => void
  onSignIn?: () => void
  onPingFromSearch?: (deal: Deal) => void
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
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center rounded-2xl border border-slate-800/50 bg-slate-900/60 px-3 py-4 text-center backdrop-blur-md">
      <Icon className={cn("mb-2 h-5 w-5 shrink-0", iconClassName)} />
      {loading ? (
        <>
          <Skeleton className="mb-2 h-6 w-10 bg-slate-800" />
          <Skeleton className="h-3 w-14 bg-slate-800/80" />
        </>
      ) : (
        <>
          <p className="text-xl font-bold leading-none text-slate-50">
            {displayValue}
          </p>
          <p className="mt-2 text-xs font-medium leading-none text-slate-500">
            {label}
          </p>
        </>
      )}
    </div>
  )
}

export function HomeView({
  onNavigate,
  onSignIn,
  onPingFromSearch,
}: HomeViewProps) {
  const { user, loading: authLoading } = useAuth()
  const { circleCount, loading: profileLoading } = useProfile()
  const { cards, loading: cardsLoading } = useWalletCards(user?.id)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProfileStats>({
    total_saved: 0,
    active_deals_count: 0,
  })
  const [searchCategory, setSearchCategory] =
    useState<DealSearchCategory>(DEFAULT_SEARCH_CATEGORY)

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
      <HomeHeroBanner
        category={searchCategory}
        onCategoryChange={setSearchCategory}
      />

      <DealSearchBar
        category={searchCategory}
        onCategoryChange={setSearchCategory}
        onNeedWallet={() => onNavigate("wallet")}
        onNeedSignIn={onSignIn}
        onNavigate={(tab) => onNavigate(tab)}
        onPingFromSearch={onPingFromSearch}
        onBrowseLenders={() => {
          setDealsTabFilter("ping_to_split")
          onNavigate("deals")
        }}
      />

      <div className="mb-6 grid h-52 w-full grid-cols-2 grid-rows-2 gap-3 sm:h-56">
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
          className="flex h-full min-h-0 w-full min-w-0 text-left transition-opacity hover:opacity-90 active:scale-[0.98]"
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
