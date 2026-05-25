"use client"

import type { DealSearchResult } from "@/lib/deal-search"
import { DealOfferDetail } from "@/components/deal-offer-detail"
import { TravelListingsPanel } from "@/components/travel-listings-panel"
import { MissingCardTeasers } from "@/components/missing-card-teasers"
import { formatInr } from "@/lib/deal-offer-breakdown"
import { cn } from "@/lib/utils"

type DealSearchResultsProps = {
  result: DealSearchResult
  onSelectListing?: (listingId: string, price: number) => void
  onNeedSignIn?: () => void
}

export function DealSearchResults({
  result,
  onSelectListing,
  onNeedSignIn,
}: DealSearchResultsProps) {
  const isTravel =
    result.category === "flight" || result.category === "hotels"
  const travelCategory =
    result.category === "flight" ? "flight" : "hotels"

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isTravel ? "Your search" : "Purchase"}
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
            <p className="text-[10px] uppercase text-slate-500">
              {isTravel ? "Fare for cards" : "Est. price"}
            </p>
            <p className="font-mono text-sm font-bold text-slate-200">
              {formatInr(result.estimated_price)}
            </p>
          </div>
        ) : null}
      </div>

      {isTravel && result.travel_listings.length > 0 ? (
        <TravelListingsPanel
          listings={result.travel_listings}
          selectedId={result.selected_travel_listing_id}
          category={travelCategory}
          onSelect={(listing) =>
            onSelectListing?.(listing.id, listing.price)
          }
        />
      ) : null}

      {result.best_offer ? (
        <div className="mb-3 border-t border-slate-800/60 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Best card — exact ₹ breakdown
          </p>
          <DealOfferDetail offer={result.best_offer} highlight />
        </div>
      ) : null}

      <p className="mb-3 text-sm text-slate-400">{result.summary}</p>

      {result.offers.length > 1 ? (
        <div className="mb-3 space-y-3 border-t border-slate-800/60 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            All cards (wallet + circle)
          </p>
          {result.offers.map((offer) => (
            <div
              key={`${offer.card_id}:${offer.owner_user_id ?? "self"}`}
              className={cn(
                "rounded-xl border p-3",
                offer.recommended
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-slate-800/50 bg-slate-950/20"
              )}
            >
              <DealOfferDetail offer={offer} compact />
            </div>
          ))}
        </div>
      ) : null}

      {result.market_offers.length > 0 && !isTravel ? (
        <div className="mb-3 space-y-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Live offers found (Serper)
          </p>
          {result.market_offers.slice(0, 4).map((offer, index) => (
            <div
              key={`${offer.title}-${index}`}
              className="border-t border-slate-800/60 pt-2 first:border-0 first:pt-0"
            >
              <p className="text-xs font-medium text-slate-200">{offer.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                {offer.snippet}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {result.missing_card_teasers?.length ? (
        <MissingCardTeasers
          teasers={result.missing_card_teasers}
          estimatedPrice={result.estimated_price}
          onNeedSignIn={onNeedSignIn}
        />
      ) : null}
    </div>
  )
}
