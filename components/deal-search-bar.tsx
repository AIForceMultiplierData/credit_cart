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
import { DealSearchResults } from "@/components/deal-search-results"
import { FlightSearchForm } from "@/components/flight-search-form"
import { HotelSearchForm } from "@/components/hotel-search-form"
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
    placeholder: "",
  },
  {
    value: "hotels",
    label: "Hotels",
    icon: Hotel,
    placeholder: "",
  },
  {
    value: "product",
    label: "Product",
    icon: Package,
    placeholder: "Paste Amazon / Flipkart product URL…",
  },
]

const TRAVEL_CATEGORIES = new Set<DealSearchCategory>(["flight", "hotels"])

export function DealSearchBar({
  onNeedWallet,
  onNeedSignIn,
}: DealSearchBarProps) {
  const { user, loading: authLoading } = useAuth()
  const { searchCards, walletCount, circleCount, loading: cardsLoading } =
    useDealSearchCards(user?.id)
  const [category, setCategory] = useState<DealSearchCategory>("product")
  const [url, setUrl] = useState("")
  const [flightSearch, setFlightSearch] = useState<FlightSearchParams>(
    defaultFlightSearchParams
  )
  const [hotelSearch, setHotelSearch] = useState<HotelSearchParams>(
    defaultHotelSearchParams
  )
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<DealSearchResult | null>(null)

  const selectedCategory =
    CATEGORY_OPTIONS.find((option) => option.value === category) ??
    CATEGORY_OPTIONS[2]

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

    const trimmedUrl = url.trim()

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
    } else if (!trimmedUrl) {
      toast.error("URL required", {
        description: "Paste the product link you want to optimize.",
      })
      return
    }

    setSearching(true)
    setResult(null)

    try {
      await runSearch({
        category,
        url: TRAVEL_CATEGORIES.has(category) ? "" : trimmedUrl,
        searchCards,
        ...(category === "flight" ? { flightSearch } : {}),
        ...(category === "hotels" ? { hotelSearch } : {}),
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
      }
    } catch (err) {
      toast.error("Could not update fare", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSearching(false)
    }
  }

  const helperCopy =
    category === "flight"
      ? "Route + dates → live flight picks → best wallet card → cards you could apply for bigger savings."
      : category === "hotels"
        ? "City + stay dates → live hotel picks → best wallet card → apply teasers below."
        : "Paste a product URL — we rank wallet + circle cards with exact ₹ off."

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
          {helperCopy}
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

          {category === "product" ? (
            <Input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={selectedCategory.placeholder}
              className="h-11 flex-1 border-slate-700 bg-slate-950 text-slate-50"
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSearch()
              }}
            />
          ) : null}
        </div>

        {category === "flight" ? (
          <div className="mt-3">
            <FlightSearchForm
              value={flightSearch}
              onChange={setFlightSearch}
            />
          </div>
        ) : null}

        {category === "hotels" ? (
          <div className="mt-3">
            <HotelSearchForm value={hotelSearch} onChange={setHotelSearch} />
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
              {TRAVEL_CATEGORIES.has(category)
                ? "Search & rank my cards"
                : "Find best deal with my cards"}
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
          onSelectListing={
            TRAVEL_CATEGORIES.has(category)
              ? (id, price) => void handleListingSelect(id, price)
              : undefined
          }
          onNeedSignIn={onNeedSignIn}
        />
      ) : null}
    </div>
  )
}
