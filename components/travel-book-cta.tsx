"use client"

import { ExternalLink, Hotel, Package, Plane } from "lucide-react"
import type { FlightSearchParams } from "@/lib/flight-search"
import type { HotelSearchParams } from "@/lib/hotel-search"
import {
  buildFlightAffiliateLinks,
  buildFlightHandoffSummary,
  buildHotelAffiliateLinks,
  buildHotelHandoffSummary,
  buildProductAffiliateLinks,
  buildProductHandoffSummary,
  primaryAffiliateBookLabel,
  type AffiliateLink,
} from "@/lib/affiliate-links"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type AffiliateBookCtaProps = {
  category: "flight" | "hotels" | "product"
  flightSearch?: FlightSearchParams | null
  hotelSearch?: HotelSearchParams | null
  sourceUrl?: string | null
  platform?: string | null
  productTitle?: string | null
  productQuery?: string | null
  bestCardLabel?: string | null
  onApplyCard?: () => void
  className?: string
}

function PartnerButton({
  link,
  variant,
}: {
  link: AffiliateLink
  variant: "primary" | "secondary"
}) {
  const isPrimary = variant === "primary"
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-bold transition-opacity hover:opacity-95",
        isPrimary
          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
          : "border border-slate-700 bg-slate-950/60 text-slate-200 hover:border-slate-600 hover:bg-slate-900"
      )}
    >
      {isPrimary ? null : (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
      )}
      <span>{link.label}</span>
      {isPrimary ? (
        <ExternalLink className="h-4 w-4 shrink-0 opacity-90" />
      ) : null}
    </a>
  )
}

function resolveLinks(
  props: AffiliateBookCtaProps
): { links: AffiliateLink[]; handoffSummary: string | null } {
  const {
    category,
    flightSearch,
    hotelSearch,
    sourceUrl,
    platform,
    productTitle,
    productQuery,
    bestCardLabel,
  } = props

  if (category === "flight" && flightSearch) {
    return {
      links: buildFlightAffiliateLinks(flightSearch, bestCardLabel),
      handoffSummary: buildFlightHandoffSummary(flightSearch),
    }
  }
  if (category === "hotels" && hotelSearch) {
    return {
      links: buildHotelAffiliateLinks(hotelSearch, bestCardLabel),
      handoffSummary: buildHotelHandoffSummary(hotelSearch),
    }
  }
  if (category === "product" && sourceUrl?.trim()) {
    return {
      links: buildProductAffiliateLinks(
        sourceUrl.trim(),
        platform ?? "Store",
        productTitle ?? productQuery ?? undefined
      ),
      handoffSummary: buildProductHandoffSummary(
        productQuery ?? productTitle ?? "",
        platform ?? undefined
      ),
    }
  }
  return { links: [], handoffSummary: null }
}

/** OTA / marketplace checkout CTAs after card ranking (dynamic deep links, no iframes) */
export function TravelBookCta(props: AffiliateBookCtaProps) {
  const { category, bestCardLabel, onApplyCard, className, platform } = props
  const { links, handoffSummary } = resolveLinks(props)

  if (links.length === 0) return null

  const primary = links.find((l) => l.primary) ?? links[0]
  const alternates = links.filter((l) => l.partner !== primary.partner)
  const Icon =
    category === "flight" ? Plane : category === "hotels" ? Hotel : Package

  const headline =
    category === "flight"
      ? "Your route & dates are pre-filled on the airline/OTA site"
      : category === "hotels"
        ? "Your destination, stay dates, rooms & guests are pre-filled"
        : "Your product link opens on the store with affiliate tracking when configured"

  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-slate-950/40 to-teal-500/5 p-4",
        className
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            {category === "product"
              ? "Checkout with your best card"
              : "Book with your best card"}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
            {headline}. Rank cards in PoolPay first — then complete purchase on
            the partner site (no live pricing engine, zero iframe widgets).
          </p>
          {handoffSummary ? (
            <p className="mt-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-2.5 py-1.5 text-[11px] font-medium text-slate-300">
              {handoffSummary}
            </p>
          ) : null}
        </div>
      </div>

      {onApplyCard ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mb-2 h-9 w-full border-violet-500/35 text-xs text-violet-200 hover:bg-violet-500/10"
          onClick={onApplyCard}
        >
          Apply for recommended card
        </Button>
      ) : null}

      <PartnerButton link={primary} variant="primary" />
      <p className="mt-2 text-center text-[10px] font-medium text-slate-500">
        {primaryAffiliateBookLabel(category, bestCardLabel, platform)}
      </p>

      {alternates.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-slate-800/60 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Also try (same search pre-filled)
          </p>
          {alternates.map((link) => (
            <PartnerButton key={link.partner} link={link} variant="secondary" />
          ))}
        </div>
      ) : null}
    </div>
  )
}
