"use client"

import { Cpu } from "lucide-react"
import type { WalletCardRecord } from "@/components/add-card-modal"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type WalletCardLendingToggleProps = {
  card: WalletCardRecord
  disabled?: boolean
  onToggle: (cardId: string, active: boolean) => void
}

export function WalletCardLendingToggle({
  card,
  disabled,
  onToggle,
}: WalletCardLendingToggleProps) {
  const active = card.active_for_lending

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 transition-colors",
        active
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-red-500/30 bg-red-500/5"
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            active ? "text-emerald-300" : "text-red-400"
          )}
        >
          {active ? "Earning on" : "Earning off"}
        </p>
        <p className="truncate text-[9px] text-slate-500">
          {active ? "Visible to buyers" : "Not visible to buyers"}
        </p>
      </div>
      <Switch
        checked={active}
        disabled={disabled}
        onCheckedChange={(checked) => onToggle(card.card_id, checked)}
        className={cn(
          "data-[state=checked]:bg-emerald-500",
          "data-[state=unchecked]:bg-red-500/70"
        )}
        aria-label={
          active
            ? `Stop lending with ${card.bank_name} ${card.card_name}`
            : `Start earning with ${card.bank_name} ${card.card_name}`
        }
      />
    </div>
  )
}

type WalletCardTileProps = {
  card: WalletCardRecord
  lendingToggle?: React.ReactNode
}

export function WalletCardTile({ card, lendingToggle }: WalletCardTileProps) {
  return (
    <article className="space-y-2">
      <div
        className={cn(
          "relative aspect-[1.58/1] overflow-hidden rounded-xl p-3 shadow-lg shadow-black/20",
          "flex flex-col justify-between border border-white/10 transition-transform duration-300 hover:scale-[1.02]",
          card.style_classes
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
        <div className="relative flex items-start justify-between">
          <div className="flex h-6 w-8 items-center justify-center rounded bg-white/20 backdrop-blur-sm">
            <Cpu className="h-3.5 w-3.5 opacity-90" aria-hidden />
          </div>
          <span className="text-[8px] font-semibold uppercase tracking-wider opacity-70">
            {card.bank_name}
          </span>
        </div>
        <div className="relative">
          <p className="text-xs font-bold leading-tight">{card.card_name}</p>
          <p className="mt-0.5 font-mono text-[8px] tracking-wider opacity-60">
            •••• 4242
          </p>
        </div>
        {card.active_for_lending ? (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-500/25 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-emerald-200">
            Live
          </span>
        ) : null}
      </div>
      {lendingToggle}
    </article>
  )
}
