"use client"

import { AlertCircle, CheckCircle2, Users } from "lucide-react"
import type { DealOffer } from "@/lib/deal-search"
import { formatInr } from "@/lib/deal-offer-breakdown"
import { cn } from "@/lib/utils"

type DealOfferDetailProps = {
  offer: DealOffer
  compact?: boolean
  highlight?: boolean
}

function BreakdownRow({
  label,
  value,
  valueClassName,
  emphasize,
}: {
  label: string
  value: string
  valueClassName?: string
  emphasize?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-xs",
        emphasize && "rounded-lg bg-slate-950/40 px-2 py-1.5"
      )}
    >
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          "font-mono font-semibold tabular-nums",
          valueClassName ?? "text-slate-200"
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function DealOfferDetail({
  offer,
  compact = false,
  highlight = false,
}: DealOfferDetailProps) {
  const hasPrice = offer.list_price != null
  const terms = offer.terms_and_conditions ?? []

  return (
    <div
      className={cn(
        compact ? "space-y-2" : "space-y-3",
        highlight &&
          "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3"
      )}
    >
      {!compact ? (
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
              offer.source === "circle"
                ? "bg-blue-500/20 text-blue-300"
                : "bg-emerald-500/20 text-emerald-300"
            )}
          >
            {offer.source === "circle" ? "Circle pool" : "Your wallet"}
          </span>
          {offer.serper_backed ? (
            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
              Serper verified
            </span>
          ) : null}
          {offer.qualifies === false ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
              <AlertCircle className="h-3 w-3" />
              Min spend not met
            </span>
          ) : null}
        </div>
      ) : null}

      {!compact ? (
        <p className="text-sm font-bold text-emerald-300">
          {offer.source === "circle" && offer.owner_name
            ? `${offer.owner_name}'s `
            : ""}
          {offer.bank_name} {offer.card_name}
        </p>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-200">
            {offer.source === "circle" && offer.owner_name
              ? `${offer.owner_name}: `
              : ""}
            {offer.bank_name} {offer.card_name}
            {offer.recommended ? " ★" : ""}
          </p>
          {offer.effective_cost != null ? (
            <span className="font-mono text-xs font-bold text-emerald-300">
              {formatInr(offer.effective_cost)} eff.
            </span>
          ) : null}
        </div>
      )}

      {offer.reason ? (
        <p className="text-xs leading-relaxed text-slate-400">{offer.reason}</p>
      ) : null}

      {hasPrice ? (
        <div className="space-y-1.5 rounded-lg border border-slate-800/60 bg-slate-950/30 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Exact ₹ breakdown
          </p>
          <BreakdownRow
            label="List / MRP price"
            value={formatInr(offer.list_price ?? null)}
          />
          <BreakdownRow
            label={`Card discount (${offer.discount_percent}%)`}
            value={`− ${formatInr(offer.discount_amount)}`}
            valueClassName="text-emerald-400"
          />
          <BreakdownRow
            label="Amount to pay at checkout"
            value={formatInr(offer.amount_to_pay ?? offer.estimated_final_price)}
            emphasize
          />

          {offer.is_pooled &&
          offer.your_cashback_share != null &&
          offer.circle_owner_share != null ? (
            <>
              <div className="my-1 border-t border-slate-800/60" />
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                <Users className="h-3 w-3" />
                50/50 pool split
              </p>
              <BreakdownRow
                label="Total cashback on card"
                value={formatInr(offer.discount_amount)}
                valueClassName="text-violet-300"
              />
              <BreakdownRow
                label="Your share (50%)"
                value={formatInr(offer.your_cashback_share)}
                valueClassName="text-emerald-300"
              />
              <BreakdownRow
                label={
                  offer.owner_name
                    ? `${offer.owner_name}'s share (50%)`
                    : "Circle owner share (50%)"
                }
                value={formatInr(offer.circle_owner_share)}
                valueClassName="text-blue-300"
              />
              <BreakdownRow
                label="Your effective cost after split"
                value={formatInr(offer.effective_cost)}
                emphasize
                valueClassName="text-emerald-200"
              />
            </>
          ) : (
            <>
              <div className="my-1 border-t border-slate-800/60" />
              <BreakdownRow
                label="Your effective cost (100% cashback)"
                value={formatInr(offer.effective_cost ?? offer.amount_to_pay)}
                emphasize
                valueClassName="text-emerald-200"
              />
            </>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Est. {offer.discount_percent}% value back — paste a product URL with
          price for exact ₹ math.
        </p>
      )}

      {offer.qualification_note ? (
        <p className="text-xs text-amber-300/90">{offer.qualification_note}</p>
      ) : null}

      {terms.length > 0 && !compact ? (
        <div className="rounded-lg border border-slate-800/50 bg-slate-950/20 p-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Terms &amp; conditions to avail discount
          </p>
          <ul className="space-y-1.5">
            {terms.map((term, index) => (
              <li
                key={`${offer.card_id}-term-${index}`}
                className="flex gap-2 text-[11px] leading-relaxed text-slate-400"
              >
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
