"use client"

import { useState } from "react"
import {
  Hotel,
  Loader2,
  Package,
  Plane,
  Search,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useWalletCards } from "@/hooks/useWalletCards"
import type { DealSearchCategory, DealSearchResult } from "@/lib/deal-search"
import { cn } from "@/lib/utils"

type DealSearchBarProps = {
  onNeedWallet?: () => void
  onNeedSignIn?: () => void
}

const CATEGORY_OPTIONS: Array<{
  value: DealSearchCategory
  label: string
  icon: typeof Plane
  placeholder: string
}> = [
  {
    value: "flight",
    label: "Flight",
    icon: Plane,
    placeholder: "Paste MakeMyTrip / Cleartrip / airline URL…",
  },
  {
    value: "hotels",
    label: "Hotels",
    icon: Hotel,
    placeholder: "Paste Booking.com / OYO / hotel URL…",
  },
  {
    value: "product",
    label: "Product",
    icon: Package,
    placeholder: "Paste Amazon / Flipkart product URL…",
  },
]

function formatInr(amount: number | null): string {
  if (amount === null) return "—"
  return `₹${amount.toLocaleString("en-IN")}`
}

export function DealSearchBar({
  onNeedWallet,
  onNeedSignIn,
}: DealSearchBarProps) {
  const { user, loading: authLoading } = useAuth()
  const { cards, loading: cardsLoading } = useWalletCards(user?.id)
  const [category, setCategory] = useState<DealSearchCategory>("product")
  const [url, setUrl] = useState("")
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<DealSearchResult | null>(null)

  const selectedCategory =
    CATEGORY_OPTIONS.find((option) => option.value === category) ??
    CATEGORY_OPTIONS[2]

  async function handleSearch() {
    if (!user) {
      onNeedSignIn?.()
      return
    }

    if (cards.length === 0) {
      toast.error("Add a card first", {
        description: "Add cards to your wallet so we can find the best offer.",
      })
      onNeedWallet?.()
      return
    }

    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      toast.error("URL required", {
        description: "Paste the product or booking link you want to optimize.",
      })
      return
    }

    setSearching(true)
    setResult(null)

    try {
      const response = await fetch("/api/deals/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          url: trimmedUrl,
          walletCards: cards.map((card) => ({
            card_id: card.card_id,
            bank_name: card.bank_name,
            card_name: card.card_name,
          })),
        }),
      })

      const payload = (await response.json()) as DealSearchResult & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Search failed.")
      }

      setResult(payload)
      toast.success("Best card found", {
        description: payload.summary,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not search for deals."
      toast.error("Search failed", { description: message })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-blue-500/10 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-300">
            AI deal finder — your wallet cards
          </p>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          Pick a category, paste any booking or product URL, and we&apos;ll rank
          which card in your wallet saves the most.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={category}
            onValueChange={(value) =>
              setCategory(value as DealSearchCategory)
            }
          >
            <SelectTrigger
              className={cn(
                "h-11 w-full shrink-0 border-slate-700 bg-slate-950 text-slate-50 sm:w-[130px]",
                "focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
              )}
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900 text-slate-50">
              {CATEGORY_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="focus:bg-slate-800 focus:text-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-emerald-400" />
                      {option.label}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={selectedCategory.placeholder}
            className="h-11 flex-1 border-slate-700 bg-slate-950 text-slate-50 placeholder:text-slate-500"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSearch()
              }
            }}
          />
        </div>

        <Button
          type="button"
          disabled={searching || authLoading || cardsLoading}
          onClick={() => void handleSearch()}
          className="mt-3 h-11 w-full bg-emerald-400 font-bold text-slate-900 hover:bg-emerald-300"
        >
          {searching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding best card…
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Find best deal with my cards
            </>
          )}
        </Button>

        {user && cards.length > 0 ? (
          <p className="mt-2 text-center text-xs text-slate-500">
            Comparing {cards.length} card{cards.length === 1 ? "" : "s"} in your
            wallet
          </p>
        ) : user && !cardsLoading ? (
          <p className="mt-2 text-center text-xs text-amber-300/90">
            No cards in wallet — add one to search
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Best for your wallet
              </p>
              <h3 className="mt-1 truncate text-base font-bold text-slate-50">
                {result.product_title}
              </h3>
              <p className="text-xs text-slate-500">
                {result.platform} · {result.category}
                {result.used_serper ? " · Serper live" : ""}
                {result.used_ai ? " · AI ranked" : " · rule-based estimate"}
              </p>
              {result.data_sources.length > 0 ? (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-600">
                  Sources: {result.data_sources.join(" + ")}
                </p>
              ) : null}
            </div>
            {result.estimated_price !== null ? (
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase text-slate-500">Est. price</p>
                <p className="font-mono text-sm font-bold text-slate-200">
                  {formatInr(result.estimated_price)}
                </p>
              </div>
            ) : null}
          </div>

          {result.best_offer ? (
            <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-sm font-bold text-emerald-300">
                {result.best_offer.bank_name} {result.best_offer.card_name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {result.best_offer.reason}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <span className="text-emerald-400">
                  ~{result.best_offer.discount_percent}% value back
                </span>
                {result.best_offer.estimated_final_price !== null ? (
                  <span className="text-slate-400">
                    Pay ~{formatInr(result.best_offer.estimated_final_price)}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="mb-3 text-sm text-slate-400">{result.summary}</p>

          {result.market_offers.length > 0 ? (
            <div className="mb-3 space-y-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                Live offers found (Serper)
              </p>
              {result.market_offers.slice(0, 4).map((offer, index) => (
                <div
                  key={`${offer.title}-${index}`}
                  className="border-t border-slate-800/60 pt-2 first:border-0 first:pt-0"
                >
                  <p className="text-xs font-medium text-slate-200">
                    {offer.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                    {offer.snippet}
                  </p>
                  <p className="mt-0.5 text-[10px] text-blue-400/80">
                    {offer.source}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {result.offers.length > 1 ? (
            <div className="space-y-2 border-t border-slate-800/60 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                All wallet cards
              </p>
              {result.offers.map((offer) => (
                <div
                  key={offer.card_id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs",
                    offer.recommended
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "text-slate-400"
                  )}
                >
                  <span>
                    {offer.bank_name} {offer.card_name}
                  </span>
                  <span>~{offer.discount_percent}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
