"use client"

import { CardVisual } from "@/components/card-visual"
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
      <div className="relative transition-transform duration-300 hover:scale-[1.02]">
        <CardVisual
          cardId={card.card_id}
          bankName={card.bank_name}
          cardName={card.card_name}
          styleClasses={card.style_classes}
          bankId={card.bank_id}
          bankLogoUrl={card.bank_logo_url}
          cardImageUrl={card.card_image_url}
          className="shadow-lg shadow-black/20"
        />
        {card.active_for_lending ? (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500/25 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-emerald-200">
            Live
          </span>
        ) : null}
      </div>
      {lendingToggle}
    </article>
  )
}
