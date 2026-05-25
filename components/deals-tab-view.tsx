"use client"

import { useEffect, useState } from "react"
import { Sparkles, Zap } from "lucide-react"
import { DealsFeed, type Deal } from "@/components/deals-feed"
import { LenderFeed } from "@/app/deals/lender-feed"
import { cn } from "@/lib/utils"

export type DealsDashboardMode = "earning" | "hot-deals"

const STORAGE_KEY = "poolpay_deals_mode"

type DealsTabViewProps = {
  onDealClick: (deal: Deal) => void
}

const MODES: Array<{
  id: DealsDashboardMode
  label: string
  shortLabel: string
  icon: typeof Zap
  activeClass: string
}> = [
  {
    id: "earning",
    label: "Earning mode",
    shortLabel: "Earning",
    icon: Sparkles,
    activeClass: "bg-blue-500/20 text-blue-200 shadow-sm shadow-blue-500/10",
  },
  {
    id: "hot-deals",
    label: "Live Deals",
    shortLabel: "Live",
    icon: Zap,
    activeClass:
      "bg-emerald-500/20 text-emerald-200 shadow-sm shadow-emerald-500/10",
  },
]

function readStoredMode(): DealsDashboardMode {
  if (typeof window === "undefined") return "hot-deals"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "earning" || stored === "lending") return "earning"
  if (stored === "hot-deals") return "hot-deals"
  return "hot-deals"
}

export function DealsTabView({ onDealClick }: DealsTabViewProps) {
  const [mode, setMode] = useState<DealsDashboardMode>("hot-deals")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setMode(readStoredMode())
    setHydrated(true)
  }, [])

  function selectMode(next: DealsDashboardMode) {
    setMode(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[1]

  return (
    <div className="pb-4">
      <div className="sticky top-[72px] z-30 border-b border-slate-800/50 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Deals dashboard
            </p>
            <p className="truncate text-sm font-semibold text-slate-200">
              {activeMode.label}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Deals dashboard mode"
            className="inline-flex shrink-0 rounded-xl border border-slate-700/80 bg-slate-900/80 p-1"
          >
            {MODES.map((option) => {
              const Icon = option.icon
              const isActive = mode === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={!hydrated}
                  onClick={() => selectMode(option.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                    isActive
                      ? option.activeClass
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{option.shortLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {hydrated && mode === "earning" ? (
        <LenderFeed />
      ) : hydrated ? (
        <DealsFeed onDealClick={onDealClick} />
      ) : (
        <div className="flex min-h-[200px] items-center justify-center px-4">
          <p className="text-sm text-slate-500">Loading deals…</p>
        </div>
      )}
    </div>
  )
}
