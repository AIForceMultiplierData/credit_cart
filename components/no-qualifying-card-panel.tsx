"use client"

import { Radio, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

type NoQualifyingCardPanelProps = {
  platform?: string | null
  estimatedPrice?: number | null
  onPingSplit?: () => void
  onBrowseLenders?: () => void
}

export function NoQualifyingCardPanel({
  platform,
  estimatedPrice,
  onPingSplit,
  onBrowseLenders,
}: NoQualifyingCardPanelProps) {
  const store = platform?.trim() || "this store"
  const priceNote =
    estimatedPrice != null
      ? ` at ₹${estimatedPrice.toLocaleString("en-IN")}`
      : ""

  return (
    <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
        No card offer on {store}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">
        None of your wallet or circle cards qualify{priceNote}. Split the bill
        50/50 with someone who has the right card — or browse lenders who turned
        on <span className="text-emerald-300">Lend &amp; earn</span> in Deals.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          className="h-11 w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 font-bold text-white hover:opacity-95"
          onClick={onPingSplit}
        >
          <Radio className="mr-2 h-4 w-4" />
          Ping 50/50 split
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full border-slate-600 text-slate-200"
          onClick={onBrowseLenders}
        >
          <Users className="mr-2 h-4 w-4 text-emerald-400" />
          See lenders earning on their cards
        </Button>
      </div>
    </div>
  )
}
