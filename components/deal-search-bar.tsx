"use client"

import { useCallback, useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useDealSearchCards } from "@/hooks/useDealSearchCards"
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
import { cn } from "@/lib/utils"

const DEAL_FINDER_HELP_ITEMS = [
  "Product → search name, compare stores, rank cards",
  "Flights / hotels → rank cards, book on OTA (pre-filled link)",
  "Wallet + circle cards ranked with T&C",
  "Pool with circle → 50/50 cashback split",
] as const

type DealSearchBarProps = {
  onNeedWallet?: () => void
  onNeedSignIn?: () => void
}

const CATEGORY_OPTIONS: Array<{
  value: DealSearchCategory
  label: string
  icon: typeof Plane
}> = [
  { value: "flight", label: "Flight", icon: Plane },
  { value: "hotels", label: "Hotels", icon: Hotel },
  { value: "product", label: "Product", icon: Package },
]

const LISTING_CATEGORIES = new Set<DealSearchCategory>([
  "flight",
  "hotels",
  "product",
])

export function DealSearchBar({
  onNeedWallet,
  onNeedSignIn,
}: DealSearchBarProps) {
  const { user, loading: authLoading } = useAuth()
  const { openLeadForm } = useCardLead()
  const { searchCards, walletCount, circleCount, loading: cardsLoading } =
    useDealSearchCards(user?.id)
  const [category, setCategory] = useState<DealSearchCategory>("flight")
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
  const [helpOpen, setHelpOpen] = useState(false)

  const showHelpTooltip = useCallback(() => {
    setHelpOpen(true)
  }, [])

  useEffect(() => {
    if (!helpOpen) return
    const timer = window.setTimeout(() => setHelpOpen(false), 3000)
    return () => window.clearTimeout(timer)
  }, [helpOpen])

  async function runSearch(body: Record<string, unknown>) {
    const response = await fetch("/api/deals/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const payload = (await response.json()) as DealSearchResult & {
      error?: string
    }

    if (!response.ok) {
      throw new Error(payload.error ?? "Search failed.")
    }

    setResult(payload)
    toast.success("Results ready", { description: payload.summary })
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
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-emerald-400" />
                      {option.label}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {result ? (
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
        />
      ) : null}
    </div>
  )
}
