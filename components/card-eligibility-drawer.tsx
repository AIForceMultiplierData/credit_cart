"use client"

import { ChevronDown } from "lucide-react"
import type { DealOffer, DealSearchResult } from "@/lib/deal-search"
import type { CardOfferStatus } from "@/lib/deal-search-views"
import { DealOfferDetail } from "@/components/deal-offer-detail"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type CardEligibilityDrawerProps = {
  offers: DealOffer[]
  views?: DealSearchResult["views"]
  defaultOpen?: boolean
}

const STATUS_STYLE: Record<
  CardOfferStatus,
  string
> = {
  qualifying: "text-emerald-400",
  platform_mismatch: "text-orange-300",
  min_spend: "text-amber-300",
  no_discount: "text-slate-400",
  unknown: "text-slate-500",
}

function ineligibleCount(offers: DealOffer[]): number {
  return offers.filter(
    (o) =>
      o.qualifies === false ||
      o.platform_mismatch ||
      o.discount_amount <= 0
  ).length
}

export function CardEligibilityDrawer({
  offers,
  views,
  defaultOpen = false,
}: CardEligibilityDrawerProps) {
  if (offers.length === 0) return null

  const n =
    views?.cards.filter((c) => c.status !== "qualifying").length ??
    ineligibleCount(offers)
  const label =
    n > 0
      ? `Why ${n} card${n === 1 ? "" : "s"} may not qualify`
      : views?.qualifying_count
        ? `${views.qualifying_count} qualifying · all wallet + circle`
        : "All cards (wallet + circle)"

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="border-t border-slate-800/60 pt-3"
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-400">
          {label}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-1">
        {offers.map((offer) => {
          const cardView = views?.cards.find(
            (c) =>
              c.card_id === offer.card_id &&
              c.source === offer.source &&
              c.owner_name === offer.owner_name
          )
          return (
            <div
              key={`${offer.card_id}:${offer.owner_user_id ?? "self"}`}
              className={cn(
                "rounded-xl border p-3",
                offer.recommended
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-slate-800/50 bg-slate-950/20"
              )}
            >
              {cardView && cardView.status !== "qualifying" ? (
                <p
                  className={cn(
                    "mb-2 text-[10px] font-medium leading-snug",
                    STATUS_STYLE[cardView.status]
                  )}
                >
                  {cardView.status_label}
                </p>
              ) : null}
              <DealOfferDetail offer={offer} compact />
            </div>
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}
