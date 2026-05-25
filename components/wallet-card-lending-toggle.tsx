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
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        active
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-red-500/30 bg-red-500/5"
      )}
    >
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-[10px] font-bold leading-tight tracking-wide",
          active ? "text-emerald-300" : "text-red-400"
        )}
      >
        {active ? (
          <>
            <span className="uppercase">Earning on</span>
            <span className="font-semibold normal-case text-slate-400">
              {" "}
              (Visible to buyers)
            </span>
          </>
        ) : (
          <>
            <span className="uppercase">Earning off</span>
            <span className="font-semibold normal-case text-slate-500">
              {" "}
              (Not visible to buyers)
            </span>
          </>
        )}
      </p>
      <Switch
        checked={active}
        disabled={disabled}
        onCheckedChange={(checked) => onToggle(card.card_id, checked)}
        className={cn(
          "shrink-0",
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
