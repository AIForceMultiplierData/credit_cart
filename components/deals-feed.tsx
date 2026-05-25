"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Loader2,
  RefreshCw,
  TrendingDown,
  Zap,
} from "lucide-react"
import { useCardLead } from "@/components/card-lead-provider"
import { CardCatalogThumbnail } from "@/components/card-catalog-thumbnail"
import { DealAvailabilityBadge } from "@/components/deal-availability-badge"
import type { DealAvailability } from "@/lib/deal-availability"
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
  availability?: DealAvailability
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
    availability: deal.availability,
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
      setSummary("Sign in to see live deals ranked by 50/50 split opportunity.")
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

  const counts = useMemo(() => {
    return {
      ping: deals.filter((d) => d.availability === "ping_to_split").length,
      circle: deals.filter((d) => d.availability === "circle").length,
      wallet: deals.filter((d) => d.availability === "wallet").length,
    }
  }, [deals])

  return (
    <div className="px-4 pb-32 pt-2">
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Live deals
          </span>
          {usedSerper ? (
            <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-300">
              Serper
            </span>
          ) : (
            <span className="rounded-md bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
              Curated
            </span>
          )}
        </div>
        <h1 className="text-balance text-2xl font-bold text-slate-50">
          All deals · ranked for you
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Ping to split first, then circle pool, then your wallet.
        </p>
        {summary && user ? (
          <p className="mt-2 text-xs font-medium text-emerald-300/80">{summary}</p>
        ) : null}
      </div>

      {user && deals.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <DealAvailabilityBadge availability="ping_to_split" />
          <span className="self-center text-[10px] text-slate-500">
            {counts.ping}
          </span>
          <DealAvailabilityBadge availability="circle" />
          <span className="self-center text-[10px] text-slate-500">
            {counts.circle}
          </span>
          <DealAvailabilityBadge availability="wallet" />
          <span className="self-center text-[10px] text-slate-500">
            {counts.wallet}
          </span>
        </div>
      ) : null}

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
            Every product is shown with wallet, circle, and ping-to-split
            availability.
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
          <p className="font-medium text-slate-300">Loading deals…</p>
          <p className="mt-1 text-sm text-slate-500">{summary}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <article
              key={deal.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border bg-slate-900/60 p-4 backdrop-blur-md",
                deal.availability === "ping_to_split" &&
                  "border-violet-500/25 shadow-violet-500/5",
                deal.availability === "circle" && "border-blue-500/20",
                deal.availability === "wallet" && "border-slate-800/50"
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <DealAvailabilityBadge availability={deal.availability} />
                <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                  {deal.platform}
                </span>
                {deal.serperBacked ? (
                  <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    Live
                  </span>
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-50">
                    {deal.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-sm text-slate-500 line-through">
                      ₹{deal.originalPrice.toLocaleString("en-IN")}
                    </span>
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
                <CardCatalogThumbnail
                  cardId={deal.cardId}
                  bankName={deal.cardBankName}
                  bankLogoUrl={deal.bankLogoUrl}
                  cardName={deal.cardName}
                  styleClasses={deal.styleClasses}
                  className="w-[4.5rem] shrink-0"
                />
              </div>

              <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1.5">
                <span className="text-base font-bold text-emerald-400">
                  ₹{deal.discountedPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-emerald-300/90">
                  {deal.cardLabel} · save ₹
                  {deal.cardDiscount.toLocaleString("en-IN")} ({deal.discountPercent}
                  %)
                </span>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                {deal.reason}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800/50 pt-3">
                {deal.availability === "ping_to_split" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-violet-500/30 text-xs text-violet-300"
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
                      Apply for card
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-violet-600 text-xs font-semibold text-white hover:bg-violet-500"
                      onClick={() => onDealClick(viralDealToLegacyDeal(deal))}
                    >
                      Ping to split →
                    </Button>
                  </>
                ) : null}
                {deal.availability === "circle" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500"
                    onClick={() => onDealClick(viralDealToLegacyDeal(deal))}
                  >
                    Pool 50/50 with {deal.circleOwnerName ?? "circle"} →
                  </Button>
                ) : null}
                {deal.availability === "wallet" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-emerald-600/90 text-xs font-semibold text-white hover:bg-emerald-500"
                    onClick={() => onDealClick(viralDealToLegacyDeal(deal))}
                  >
                    Use your card →
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
