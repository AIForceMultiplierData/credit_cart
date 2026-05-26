"use client"

import { ExternalLink, Hotel, Package, Plane, Check } from "lucide-react"
import type { TravelListing } from "@/lib/deal-search"
import { wrapAmazonProductUrl, wrapFlipkartProductUrl } from "@/lib/affiliate-links"
import { formatInr } from "@/lib/deal-offer-breakdown"
import { cn } from "@/lib/utils"

type TravelListingsPanelProps = {
  listings: TravelListing[]
  selectedId: string | null
  onSelect: (listing: TravelListing) => void
  category: "flight" | "hotels" | "product"
}

function productListingHref(listing: TravelListing): string | null {
  const url = listing.product_url?.trim()
  if (!url) return null
  if (/amazon\.(in|com)/i.test(url)) return wrapAmazonProductUrl(url)
  if (/flipkart\.com/i.test(url)) return wrapFlipkartProductUrl(url)
  return url
}

export function TravelListingsPanel({
  listings,
  selectedId,
  onSelect,
  category,
}: TravelListingsPanelProps) {
  if (listings.length === 0) return null

  const Icon =
    category === "flight" ? Plane : category === "hotels" ? Hotel : Package
  const label =
    category === "flight"
      ? "Flights · OTAs & airlines"
      : category === "hotels"
        ? "Hotels · OTAs & chains"
        : "Phones & gadgets · major stores only"

  return (
    <div className="mb-4 space-y-2 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-sky-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
          {label}
        </p>
        <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
          {listings.length} options
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        {category === "product"
          ? "We hide cases, rentals & junk prices. Tap a real phone listing (Amazon, Flipkart, Croma…) to rank cards."
          : category === "flight"
            ? "Visa, bus & junk fares hidden. Tap MakeMyTrip, Cleartrip, or an airline — route & dates pre-filled."
            : "Hourly stays & junk rates hidden. Tap Booking.com, MakeMyTrip, or a hotel — dates & guests pre-filled."}
      </p>

      <div className="space-y-2">
        {listings.map((listing) => {
          const selected = listing.id === selectedId
          const shopHref =
            category === "product"
              ? productListingHref(listing)
              : listing.product_url &&
                  !/google\./i.test(listing.product_url)
                ? listing.product_url
                : null

          return (
            <div
              key={listing.id}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                selected
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-slate-800/80 bg-slate-950/40"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(listing)}
                className="flex w-full items-start gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {listing.provider}
                    </span>
                    {listing.badge ? (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                        {listing.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">
                    {listing.title}
                  </p>
                  {listing.variant_label ? (
                    <p className="text-[11px] font-medium text-sky-300/90">
                      {listing.variant_label}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-slate-500">{listing.subtitle}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {listing.meta.map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {listing.price > 0 ? (
                    <span className="font-mono text-base font-bold text-slate-50">
                      {formatInr(listing.price)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Your link</span>
                  )}
                  {selected ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                      <Check className="h-3 w-3" />
                      Selected
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Select</span>
                  )}
                </div>
              </button>
              {shopHref ? (
                <a
                  href={shopHref}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 py-2 text-[11px] font-semibold text-emerald-300 hover:bg-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {category === "product"
                    ? `Buy on ${listing.provider}`
                    : `Book on ${listing.provider}`}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
