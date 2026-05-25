"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Clock,
  Loader2,
  RefreshCw,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react"
import { useCardLead } from "@/components/card-lead-provider"
import { CardCatalogThumbnail } from "@/components/card-catalog-thumbnail"
import type { ViralDeal } from "@/lib/viral-deals"
import { useAuth } from "@/hooks/useAuth"
import { useDealSearchCards } from "@/hooks/useDealSearchCards"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Kept for PingDrawer compatibility */
export interface Deal {
  id: string
  title: string
  originalPrice: number
  discountedPrice: number
  cardName: string
  cardDiscount: number
  timeLeft: string
  image?: string
  isDemo?: boolean
  platform?: string
  productUrl?: string
  cardId?: string
  cardBankName?: string
  cardFullName?: string
  discountPercent?: number
  styleClasses?: string
  inCircle?: boolean
  circleOwnerName?: string
  splitHint?: string
  serperBacked?: boolean
}

function viralDealToLegacyDeal(deal: ViralDeal): Deal {
  return {
    id: deal.id,
    title: deal.title,
    originalPrice: deal.originalPrice,
    discountedPrice: deal.discountedPrice,
    cardName: deal.cardBankName,
    cardDiscount: deal.cardDiscount,
    timeLeft: deal.platform,
    isDemo: false,
    platform: deal.platform,
    productUrl: deal.productUrl,
    cardId: deal.cardId,
    cardBankName: deal.cardBankName,
    cardFullName: deal.cardName,
    discountPercent: deal.discountPercent,
    styleClasses: deal.styleClasses,
    inCircle: deal.inCircle,
    circleOwnerName: deal.circleOwnerName,
    splitHint: deal.splitHint,
    serperBacked: deal.serperBacked,
  }
}

interface DealsFeedProps {
  onDealClick: (deal: Deal) => void
}

export function DealsFeed({ onDealClick }: DealsFeedProps) {
  const { user } = useAuth()
  const { searchCards, loading: cardsLoading } = useDealSearchCards(user?.id)
  const { openLeadForm } = useCardLead()
  const [deals, setDeals] = useState<ViralDeal[]>([])
  const [summary, setSummary] = useState<string>("")
  const [usedSerper, setUsedSerper] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDeals = useCallback(async () => {
    if (!user) {
      setDeals([])
      setSummary("Sign in to see live viral deals with cards outside your wallet.")
      return
    }

    if (cardsLoading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/deals/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchCards }),
      })

      const payload = (await response.json()) as {
        deals?: ViralDeal[]
        summary?: string
        used_serper?: boolean
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load deals.")
      }

      setDeals(payload.deals ?? [])
      setSummary(payload.summary ?? "")
      setUsedSerper(Boolean(payload.used_serper))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load viral deals."
      setError(message)
      setDeals([])
    } finally {
      setLoading(false)
    }
  }, [user, searchCards, cardsLoading])

  useEffect(() => {
    void loadDeals()
  }, [loadDeals])

  return (
    <div className="px-4 pb-32 pt-2">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Live viral picks
          </span>
          {usedSerper ? (
            <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-300">
              Serper
            </span>
          ) : null}
        </div>
        <h1 className="text-balance text-2xl font-bold text-slate-50">
          Deals Outside Circle
        </h1>
        <p className="mt-1 text-sm font-medium text-emerald-300/90">
          Available at 50/50 Split
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || cardsLoading || !user}
          onClick={() => void loadDeals()}
          className="border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
        >
          {loading ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
          <p className="font-medium text-slate-300">Sign in for live deals</p>
          <p className="mt-1 text-sm text-slate-500">
            We hide cards already in your wallet and surface the best outside
            options.
          </p>
        </div>
      ) : loading || cardsLoading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-800/50 bg-slate-900/40">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 text-center">
          <p className="font-medium text-red-300">{error}</p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => void loadDeals()}
          >
            Retry
          </Button>
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 text-center">
          <p className="font-medium text-slate-300">No outside-wallet deals</p>
          <p className="mt-1 text-sm text-slate-500">
            Either Serper returned no products, or every viral pick already
            matches a card in your wallet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <article
              key={deal.id}
              className={cn(
                "relative overflow-hidden rounded-2xl",
                "border border-slate-800/50 bg-slate-900/60 backdrop-blur-md",
                "p-4 shadow-lg shadow-black/10"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                      {deal.platform}
                    </span>
                    {deal.inCircle ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                        <Users className="h-3 w-3" />
                        In circle
                      </span>
                    ) : null}
                    {deal.serperBacked ? (
                      <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        Live offer
                      </span>
                    ) : null}
                  </div>
                  <h3 className="truncate text-lg font-semibold leading-tight text-slate-50">
                    {deal.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-500 line-through">
                      ₹{deal.originalPrice.toLocaleString("en-IN")}
                    </span>
                    <TrendingDown className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
                <CardCatalogThumbnail
                  bankName={deal.cardBankName}
                  bankLogoUrl={deal.bankLogoUrl}
                  cardName={deal.cardName}
                  styleClasses={deal.styleClasses}
                  className="w-[4.75rem] shrink-0"
                />
              </div>

              <div className="mt-3">
                <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
                  <span className="text-lg font-bold text-emerald-400">
                    ₹{deal.discountedPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-emerald-400/90">
                    with {deal.cardLabel}
                  </span>
                  <span className="text-xs text-emerald-300/80">
                    (save ₹{deal.cardDiscount.toLocaleString("en-IN")} ·{" "}
                    {deal.discountPercent}%)
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-violet-300/90">
                {deal.splitHint}
              </p>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/50 pt-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>Not in your wallet</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 border-violet-500/30 text-xs text-violet-300 hover:bg-violet-500/10"
                    onClick={() =>
                      openLeadForm({
                        card_id: deal.cardId,
                        bank_name: deal.cardBankName,
                        card_name: deal.cardName,
                        style_classes: deal.styleClasses,
                        source: "viral_deals_feed",
                      })
                    }
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-emerald-500/15 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    onClick={() => onDealClick(viralDealToLegacyDeal(deal))}
                  >
                    Ping 50/50 →
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
