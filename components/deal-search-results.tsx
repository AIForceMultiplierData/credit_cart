"use client"

import type { DealSearchResult, TravelListing } from "@/lib/deal-search"
import { DealOfferDetail } from "@/components/deal-offer-detail"
import { TravelListingsPanel } from "@/components/travel-listings-panel"
import { TravelBookCta } from "@/components/travel-book-cta"
import { MissingCardTeasers } from "@/components/missing-card-teasers"
import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"
import type { ProductSearchParams } from "@/lib/product-search"
import { formatInr } from "@/lib/deal-offer-breakdown"
import { cn } from "@/lib/utils"

type DealSearchResultsProps = {
  result: DealSearchResult
  flightSearch?: FlightSearchParams | null
  hotelSearch?: HotelSearchParams | null
  productSearch?: ProductSearchParams | null
  onSelectListing?: (listingId: string, price: number) => void
  onNeedSignIn?: () => void
  onApplyBestCard?: () => void
}

function selectedListing(
  result: DealSearchResult
): TravelListing | null {
  if (!result.selected_travel_listing_id) return null
  return (
    result.travel_listings.find(
      (l) => l.id === result.selected_travel_listing_id
    ) ?? null
  )
}

export function DealSearchResults({
  result,
  flightSearch,
  hotelSearch,
  productSearch,
  onSelectListing,
  onNeedSignIn,
  onApplyBestCard,
}: DealSearchResultsProps) {
  const isTravel =
    result.category === "flight" || result.category === "hotels"
  const isProduct = result.category === "product"
  const listingCategory = result.category as "flight" | "hotels" | "product"
  const hasListings = result.travel_listings.length > 0
  const picked = selectedListing(result)
  const checkoutUrl =
    picked?.product_url?.trim() || result.source_url || null

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isProduct
              ? "Product search"
              : isTravel
                ? "Your search"
                : "Purchase"}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-50">
            {result.product_title}
          </h3>
          <p className="text-xs text-slate-500">
            {result.platform}
            {picked && isProduct ? ` · ${picked.provider} selected` : ""}
            {result.used_serper ? " · live listings" : ""}
            {result.used_ai ? " · AI ranked" : " · rule-based"}
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
              {isProduct ? "Price for cards" : isTravel ? "Fare for cards" : "Est. price"}
            </p>
            <p className="font-mono text-sm font-bold text-slate-200">
              {formatInr(result.estimated_price)}
            </p>
          </div>
        ) : null}
      </div>

      {hasListings ? (
        <TravelListingsPanel
          listings={result.travel_listings}
          selectedId={result.selected_travel_listing_id}
          category={listingCategory}
          onSelect={(listing) =>
            onSelectListing?.(listing.id, listing.price)
          }
        />
      ) : null}

      {result.best_offer ? (
        <div className="mb-3 border-t border-slate-800/60 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Best card — exact ₹ breakdown
            {isProduct && picked
              ? ` on ${picked.provider}`
              : ""}
          </p>
          <DealOfferDetail offer={result.best_offer} highlight />
        </div>
      ) : null}

      {isTravel && (flightSearch || hotelSearch) ? (
        <TravelBookCta
          className="mb-3"
          category={result.category === "flight" ? "flight" : "hotels"}
          flightSearch={flightSearch}
          hotelSearch={hotelSearch}
          platform={result.platform}
          bestCardLabel={
            result.best_offer
              ? `${result.best_offer.bank_name} ${result.best_offer.card_name}`
              : null
          }
          onApplyCard={onApplyBestCard}
        />
      ) : null}

      {isProduct && checkoutUrl ? (
        <TravelBookCta
          className="mb-3"
          category="product"
          sourceUrl={checkoutUrl}
          platform={picked?.provider ?? result.platform}
          productTitle={result.product_title}
          productQuery={productSearch?.query ?? result.product_title}
          bestCardLabel={
            result.best_offer
              ? `${result.best_offer.bank_name} ${result.best_offer.card_name}`
              : null
          }
          onApplyCard={onApplyBestCard}
        />
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
