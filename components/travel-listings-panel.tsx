"use client"

import { Plane, Hotel, Check } from "lucide-react"
import type { TravelListing } from "@/lib/deal-search"
import { formatInr } from "@/lib/deal-offer-breakdown"
import { cn } from "@/lib/utils"

type TravelListingsPanelProps = {
  listings: TravelListing[]
  selectedId: string | null
  onSelect: (listing: TravelListing) => void
  category: "flight" | "hotels"
}

export function TravelListingsPanel({
  listings,
  selectedId,
  onSelect,
  category,
}: TravelListingsPanelProps) {
  if (listings.length === 0) return null

  const Icon = category === "flight" ? Plane : Hotel
  const label =
    category === "flight" ? "Live flight picks" : "Live hotel picks"

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
        Tap a fare to lock it for card ranking. Book on MakeMyTrip, Cleartrip, or
        Booking.com via the buttons below — your route and dates are pre-filled.
      </p>

      <div className="space-y-2">
        {listings.map((listing) => {
          const selected = listing.id === selectedId
          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => onSelect(listing)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                selected
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-slate-800/80 bg-slate-950/40 hover:border-slate-600"
              )}
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
                <p className="mt-0.5 text-xs text-slate-300">{listing.title}</p>
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
                <span className="font-mono text-base font-bold text-slate-50">
                  {formatInr(listing.price)}
                </span>
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
          )
        })}
      </div>
    </div>
  )
}
