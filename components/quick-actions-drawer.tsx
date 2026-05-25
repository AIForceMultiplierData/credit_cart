"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowRight, Menu, Sparkles, TrendingUp, Zap } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { useWalletCards } from "@/hooks/useWalletCards"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type TabTarget = "deals" | "wallet" | "activity"

type QuickActionsDrawerProps = {
  onNavigate: (tab: TabTarget) => void
}

const ACTIONS: Array<{
  tab: TabTarget
  title: string
  icon: typeof Zap
  iconWrap: string
  border: string
  arrow: string
  subtitle: (ctx: { deals: number; cards: number }) => string
}> = [
  {
    tab: "deals",
    title: "Browse Live Deals",
    icon: Zap,
    iconWrap: "bg-emerald-500/20",
    border: "border-emerald-500/20 from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/40",
    arrow: "text-emerald-400",
    subtitle: ({ deals }) =>
      `${deals} active deal${deals === 1 ? "" : "s"}`,
  },
  {
    tab: "wallet",
    title: "Manage Wallet",
    icon: Sparkles,
    iconWrap: "bg-blue-500/20",
    border: "border-blue-500/20 from-blue-500/10 to-blue-500/5 hover:border-blue-500/40",
    arrow: "text-blue-400",
    subtitle: ({ cards }) =>
      `${cards} card${cards === 1 ? "" : "s"} in wallet`,
  },
  {
    tab: "activity",
    title: "View Activity",
    icon: TrendingUp,
    iconWrap: "bg-purple-500/20",
    border: "border-purple-500/20 from-purple-500/10 to-purple-500/5 hover:border-purple-500/40",
    arrow: "text-purple-400",
    subtitle: ({ deals }) =>
      `${deals} contract${deals === 1 ? "" : "s"}`,
  },
]

export function QuickActionsDrawer({ onNavigate }: QuickActionsDrawerProps) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { loading: profileLoading } = useProfile()
  const { cards, loading: cardsLoading } = useWalletCards(user?.id)
  const [activeDeals, setActiveDeals] = useState(0)

  const fetchDeals = useCallback(async () => {
    if (!user) {
      setActiveDeals(0)
      return
    }
    const { data } = await supabase
      .from("profiles")
      .select("active_deals_count")
      .eq("id", user.id)
      .maybeSingle()
    const n = Number(data?.active_deals_count)
    setActiveDeals(Number.isFinite(n) && n > 0 ? Math.round(n) : 0)
  }, [user])

  useEffect(() => {
    void fetchDeals()
  }, [fetchDeals])

  function go(tab: TabTarget) {
    setOpen(false)
    onNavigate(tab)
  }

  const ctx = { deals: activeDeals, cards: cards.length }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-slate-300 hover:bg-slate-800 hover:text-slate-50"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(100vw-3rem,280px)] border-slate-800 bg-slate-950 p-0 text-slate-50"
      >
        <SheetHeader className="border-b border-slate-800 px-4 py-4 text-left">
          <SheetTitle className="text-base font-bold text-slate-50">
            Quick Actions
          </SheetTitle>
          <p className="text-xs text-slate-500">Jump to deals, wallet, or activity</p>
        </SheetHeader>
        <nav className="space-y-2 p-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.tab}
                type="button"
                onClick={() => go(action.tab)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-xl border bg-gradient-to-r p-3",
                  "transition-all active:scale-[0.98]",
                  action.border
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      action.iconWrap
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-semibold text-slate-50">
                      {action.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {profileLoading || cardsLoading
                        ? "…"
                        : action.subtitle(ctx)}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                    action.arrow
                  )}
                />
              </button>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
