"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { DealCategorySelect } from "@/components/deal-category-select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DealSearchCategory } from "@/lib/deal-search"
import { cn } from "@/lib/utils"

const AI_TOOLTIP_MS = 3000

const POOLPAY_EXPLAIN =
  "Pool credit cards with your trusted circle to unlock exclusive discounts on premium products. AI matches your wallet + circle cards to the best store, fare, and checkout — so you buy the smart way."

type HomeHeroBannerProps = {
  category: DealSearchCategory
  onCategoryChange: (category: DealSearchCategory) => void
}

export function HomeHeroBanner({
  category,
  onCategoryChange,
}: HomeHeroBannerProps) {
  const [tipOpen, setTipOpen] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTipBriefly = useCallback(() => {
    setTipOpen(true)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => {
      setTipOpen(false)
      dismissTimer.current = null
    }, AI_TOOLTIP_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [])

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-purple-500/20" />
      <div className="relative p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Tooltip open={tipOpen} onOpenChange={setTipOpen}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onMouseEnter={() => showTipBriefly()}
                  onFocus={() => showTipBriefly()}
                  onClick={() => showTipBriefly()}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "bg-emerald-400/20 outline-none transition-colors",
                    "hover:bg-emerald-400/30 focus-visible:ring-2 focus-visible:ring-emerald-400/50",
                    tipOpen && "ring-2 ring-emerald-400/40"
                  )}
                  aria-label="How PoolPay AI works"
                >
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="max-w-[min(100vw-2.5rem,300px)] border border-emerald-500/30 bg-slate-900 px-3 py-2.5 text-[11px] leading-relaxed text-slate-200 [&>svg]:fill-slate-900"
                onPointerDownOutside={() => setTipOpen(false)}
              >
                <p className="mb-1.5 font-semibold text-emerald-300">
                  AI-powered co-purchase
                </p>
                <p>{POOLPAY_EXPLAIN}</p>
              </TooltipContent>
            </Tooltip>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-emerald-400">
                Welcome to PoolPay
              </span>
              <span className="ml-2 inline-flex rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                AI
              </span>
            </div>
          </div>
        </div>

        <h1 className="mb-1 text-balance text-3xl font-bold leading-tight text-slate-50">
          Co-Purchase.
          <br />
          <span className="text-emerald-400">Save Smarter, Together.</span>
        </h1>
        <p className="mb-5 text-sm font-medium text-slate-400">
          AI ranks cards &amp; stores so your circle buys the best way — not
          the expensive way.
        </p>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/40 p-3 backdrop-blur-sm">
          <p className="mb-2 text-sm font-semibold text-slate-200">
            What&apos;s on your mind today?
          </p>
          <DealCategorySelect
            value={category}
            onValueChange={onCategoryChange}
            triggerClassName="border-slate-600/80 bg-slate-900/90"
          />
        </div>
      </div>
    </div>
  )
}
