"use client"

import { Users } from "lucide-react"
import type { MissingCardTeaser } from "@/lib/deal-search"
import { CardCatalogThumbnail } from "@/components/card-catalog-thumbnail"
import { useAuth } from "@/hooks/useAuth"
import { useCardLead } from "@/components/card-lead-provider"
import { Button } from "@/components/ui/button"

type MissingCardTeasersProps = {
  teasers: MissingCardTeaser[]
  estimatedPrice: number | null
  onNeedSignIn?: () => void
}

function formatSavings(
  teaser: MissingCardTeaser,
  estimatedPrice: number | null
) {
  if (estimatedPrice !== null && teaser.discount_amount > 0) {
    return `₹${teaser.discount_amount.toLocaleString("en-IN")}`
  }
  return `~${teaser.discount_percent}%`
}

export function MissingCardTeasers({
  teasers,
  estimatedPrice,
  onNeedSignIn,
}: MissingCardTeasersProps) {
  const { user } = useAuth()
  const { openLeadForm } = useCardLead()

  if (teasers.length === 0) return null

  function handleApply(teaser: MissingCardTeaser) {
    if (!user) {
      onNeedSignIn?.()
      return
    }
    openLeadForm({
      card_id: teaser.card_id,
      bank_name: teaser.bank_name,
      card_name: teaser.card_name,
      style_classes: teaser.style_classes,
      source: "missing_card_teaser",
    })
  }

  return (
    <div className="mb-3 rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-slate-900/40 to-fuchsia-500/5 p-3">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
          Cards you&apos;re missing
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Get your own card — keep{" "}
          <span className="font-semibold text-violet-200">100% cashback</span>.
          No 50/50 split with circle.
        </p>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {teasers.map((teaser) => (
          <article key={teaser.card_id} className="w-[108px] shrink-0">
            <div className="relative">
              <CardCatalogThumbnail
                cardId={teaser.card_id}
                bankName={teaser.bank_name}
                bankLogoUrl={teaser.bank_logo_url}
                cardName={teaser.card_name}
                styleClasses={teaser.style_classes}
                className="rounded-lg"
                subtitle={
                  <span className="font-semibold text-emerald-300/95">
                    Save {formatSavings(teaser, estimatedPrice)}
                  </span>
                }
              />
              {teaser.in_circle ? (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/30 text-blue-200">
                  <Users className="h-2.5 w-2.5" aria-label="In circle" />
                </span>
              ) : null}
            </div>

            {teaser.in_circle && teaser.circle_owner_name ? (
              <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-blue-300/90">
                {teaser.circle_owner_name} pools this — you split rewards today
              </p>
            ) : (
              <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-slate-500">
                {teaser.reason}
              </p>
            )}

            <Button
              type="button"
              size="sm"
              className="mt-1.5 h-7 w-full rounded-lg bg-violet-500/90 px-2 text-[10px] font-bold text-white hover:bg-violet-400"
              onClick={() => handleApply(teaser)}
            >
              Apply now
            </Button>
          </article>
        ))}
      </div>
    </div>
  )
}
