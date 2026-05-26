"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Search, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { Deal } from "@/components/deals-feed"
import { useAuth } from "@/hooks/useAuth"
import { useDealSearchCards } from "@/hooks/useDealSearchCards"
import type { DealSearchHistoryEntry } from "@/lib/deals-search-history-store"
import type { DealSearchCategory, DealSearchResult } from "@/lib/deal-search"
import {
  defaultFlightSearchParams,
  validateFlightSearch,
  type FlightSearchParams,
} from "@/lib/flight-search"
import {
  defaultHotelSearchParams,
  validateHotelSearch,
  type HotelSearchParams,
} from "@/lib/hotel-search"
import {
  defaultProductSearchParams,
  validateProductSearch,
  type ProductSearchParams,
} from "@/lib/product-search"
import { DealSearchResults } from "@/components/deal-search-results"
import { FlightSearchForm } from "@/components/flight-search-form"
import { HotelSearchForm } from "@/components/hotel-search-form"
import { ProductSearchForm } from "@/components/product-search-form"
import { useCardLead } from "@/components/card-lead-provider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
const DEAL_FINDER_HELP_ITEMS = [
  "Product → search name, compare stores, rank cards",
  "Flights / hotels → rank cards, book on OTA (pre-filled link)",
  "Wallet + circle cards ranked with T&C",
  "Pool with circle → 50/50 cashback split",
] as const

type DealSearchBarProps = {
  category: DealSearchCategory
  onCategoryChange: (category: DealSearchCategory) => void
  onNeedWallet?: () => void
  onNeedSignIn?: () => void
  onNavigate?: (tab: "deals" | "wallet") => void
  onPingFromSearch?: (deal: Deal) => void
}

function dealFromSearchResult(result: DealSearchResult): Deal {
  const price = result.estimated_price ?? 0
  const best = result.best_offer
  return {
    id: `search-${Date.now()}`,
    title: result.product_title,
    originalPrice: price,
    discountedPrice: best?.amount_to_pay ?? price,
    cardName: best?.card_name ?? "Split with circle",
    cardDiscount: best?.discount_amount ?? 0,
    timeLeft: "48h",
    platform: result.platform,
    cardId: best?.card_id,
    cardBankName: best?.bank_name,
    cardFullName: best?.card_name,
    discountPercent: best?.discount_percent,
    splitHint: "50/50 pool from your search",
  }
}

const LISTING_CATEGORIES = new Set<DealSearchCategory>([
  "flight",
  "hotels",
  "product",
])

export function DealSearchBar({
  category,
  onCategoryChange,
  onNeedWallet,
  onNeedSignIn,
  onNavigate,
  onPingFromSearch,
}: DealSearchBarProps) {
  const { user, session, loading: authLoading } = useAuth()
  const { openLeadForm } = useCardLead()
  const { searchCards, walletCount, circleCount, loading: cardsLoading } =
    useDealSearchCards(user?.id)
  const [flightSearch, setFlightSearch] = useState<FlightSearchParams>(
    defaultFlightSearchParams
  )
  const [hotelSearch, setHotelSearch] = useState<HotelSearchParams>(
    defaultHotelSearchParams
  )
  const [productSearch, setProductSearch] = useState<ProductSearchParams>(
    defaultProductSearchParams
  )
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<DealSearchResult | null>(null)
  const [history, setHistory] = useState<DealSearchHistoryEntry[]>([])
  const [helpOpen, setHelpOpen] = useState(false)

  const loadHistory = useCallback(async () => {
    const token = session?.access_token
    if (!user || !token) {
      setHistory([])
      return
    }
    try {
      const res = await fetch("/api/deals/search-history?limit=15", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await res.json()) as {
        history?: DealSearchHistoryEntry[]
        error?: string
      }
      if (res.ok && payload.history) {
        setHistory(payload.history)
      }
    } catch {
      /* non-fatal */
    }
  }, [user, session?.access_token])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const showHelpTooltip = useCallback(() => {
    setHelpOpen(true)
  }, [])

  useEffect(() => {
    if (!helpOpen) return
    const timer = window.setTimeout(() => setHelpOpen(false), 3000)
    return () => window.clearTimeout(timer)
  }, [helpOpen])

  async function runSearch(body: Record<string, unknown>) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const response = await fetch("/api/deals/search", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    const payload = (await response.json()) as DealSearchResult & {
      error?: string
    }

    if (!response.ok) {
      throw new Error(payload.error ?? "Search failed.")
    }

    setResult(payload)
    void loadHistory()
    toast.success("Results ready", { description: payload.summary })
  }

  function replayHistoryEntry(entry: DealSearchHistoryEntry) {
    onCategoryChange(entry.category)
    setResult(entry.result_payload)
    const rb = entry.request_body
    if (entry.category === "flight" && rb.flightSearch) {
      setFlightSearch(rb.flightSearch as FlightSearchParams)
    }
    if (entry.category === "hotels" && rb.hotelSearch) {
      setHotelSearch(rb.hotelSearch as HotelSearchParams)
    }
    if (entry.category === "product" && rb.productSearch) {
      setProductSearch(rb.productSearch as ProductSearchParams)
    }
    toast.message("Restored search", { description: entry.search_label })
  }

  async function handleSearch() {
    if (!user) {
      onNeedSignIn?.()
      return
    }

    if (cardsLoading) {
      toast.message("Loading wallet cards…")
      return
    }

    if (searchCards.length === 0) {
      toast.error("Add a card first", {
        description: "Add cards to your wallet so we can find the best offer.",
      })
      onNeedWallet?.()
      return
    }

    if (category === "flight") {
      const valid = validateFlightSearch(flightSearch)
      if (!valid.ok) {
        toast.error("Complete flight details", { description: valid.message })
        return
      }
    } else if (category === "hotels") {
      const valid = validateHotelSearch(hotelSearch)
      if (!valid.ok) {
        toast.error("Complete hotel details", { description: valid.message })
        return
      }
    } else {
      const valid = validateProductSearch(productSearch, {
        requirePrice: false,
      })
      if (!valid.ok) {
        toast.error("Complete product search", { description: valid.message })
        return
      }
    }

    setSearching(true)
    setResult(null)

    try {
      await runSearch({
        category,
        url: "",
        searchCards,
        ...(category === "flight" ? { flightSearch } : {}),
        ...(category === "hotels" ? { hotelSearch } : {}),
        ...(category === "product" ? { productSearch } : {}),
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not search for deals."
      toast.error("Search failed", { description: message })
    } finally {
      setSearching(false)
    }
  }

  async function handleListingSelect(listingId: string, price: number) {
    if (!user || searchCards.length === 0) return

    setSearching(true)
    try {
      if (category === "flight") {
        const next: FlightSearchParams = {
          ...flightSearch,
          selectedListingId: listingId,
          estimatedFare: price,
        }
        setFlightSearch(next)
        await runSearch({ category, url: "", searchCards, flightSearch: next })
      } else if (category === "hotels") {
        const next: HotelSearchParams = {
          ...hotelSearch,
          selectedListingId: listingId,
          estimatedTotal: price,
        }
        setHotelSearch(next)
        await runSearch({ category, url: "", searchCards, hotelSearch: next })
      } else {
        const next: ProductSearchParams = {
          ...productSearch,
          selectedListingId: listingId,
          estimatedPrice: price > 0 ? price : productSearch.estimatedPrice,
        }
        setProductSearch(next)
        await runSearch({ category, url: "", searchCards, productSearch: next })
      }
    } catch (err) {
      toast.error("Could not update selection", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-blue-500/10 p-4 backdrop-blur-md">
        <Tooltip open={helpOpen} onOpenChange={setHelpOpen}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={showHelpTooltip}
              className="mb-4 flex items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
              aria-label="Get Best Deals — show how it works"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">
                Get Best Deals
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="start"
            sideOffset={6}
            className="max-w-[min(100vw-2rem,280px)] border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-200 [&>svg]:fill-slate-900 [&>svg]:bg-slate-900"
          >
            <ul className="space-y-1.5 text-left text-[11px] leading-snug">
              {DEAL_FINDER_HELP_ITEMS.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>

        {category === "flight" ? (
          <div className="mt-3 min-w-0 overflow-hidden">
            <FlightSearchForm
              value={flightSearch}
              onChange={setFlightSearch}
            />
          </div>
        ) : null}

        {category === "hotels" ? (
          <div className="mt-3 min-w-0 overflow-hidden">
            <HotelSearchForm value={hotelSearch} onChange={setHotelSearch} />
          </div>
        ) : null}

        {category === "product" ? (
          <div className="mt-3 min-w-0 overflow-hidden">
            <ProductSearchForm
              value={productSearch}
              onChange={setProductSearch}
            />
          </div>
        ) : null}

        <Button
          type="button"
          disabled={searching || authLoading || cardsLoading}
          onClick={() => void handleSearch()}
          className="mt-3 h-11 w-full bg-emerald-400 font-bold text-slate-900 hover:bg-emerald-300"
        >
          {searching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search & rank my cards
            </>
          )}
        </Button>

        {user && searchCards.length > 0 ? (
          <p className="mt-2 text-center text-xs text-slate-500">
            Comparing {walletCount} wallet + {circleCount} circle card
            {walletCount + circleCount === 1 ? "" : "s"}
          </p>
        ) : null}

        {history.length > 0 ? (
          <div className="mt-3 border-t border-slate-800/60 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Recent searches
            </p>
            <div className="flex flex-wrap gap-1.5">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => replayHistoryEntry(entry)}
                  className="max-w-full truncate rounded-lg border border-slate-700/80 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-200"
                  title={new Date(entry.created_at).toLocaleString("en-IN")}
                >
                  {entry.search_label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {result ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-medium text-slate-400">Search results</p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-3 w-3" />
              Close
            </button>
          </div>
          <DealSearchResults
          result={result}
          flightSearch={category === "flight" ? flightSearch : null}
          hotelSearch={category === "hotels" ? hotelSearch : null}
          productSearch={category === "product" ? productSearch : null}
          onSelectListing={
            LISTING_CATEGORIES.has(category)
              ? (id, price) => void handleListingSelect(id, price)
              : undefined
          }
          onNeedSignIn={onNeedSignIn}
          onApplyBestCard={
            result.best_offer
              ? () =>
                  openLeadForm({
                    card_id: result.best_offer!.card_id,
                    bank_name: result.best_offer!.bank_name,
                    card_name: result.best_offer!.card_name,
                    source: "deal_search",
                  })
              : undefined
          }
          onPingSplit={() => {
            if (onPingFromSearch) {
              onPingFromSearch(dealFromSearchResult(result))
            } else {
              onNavigate?.("deals")
            }
          }}
          onBrowseLenders={() => onNavigate?.("deals")}
        />
        </div>
      ) : null}
    </div>
  )
}
