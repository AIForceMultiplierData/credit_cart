"use client"

import { BankLogo } from "@/components/bank-logo"
import { resolveCardImageUrl } from "@/lib/card-photo-registry"
import { cn } from "@/lib/utils"

type CardVisualProps = {
  cardId: string
  bankName: string
  cardName: string
  styleClasses: string
  bankId?: string | null
  bankLogoUrl?: string | null
  cardImageUrl?: string | null
  className?: string
  subtitle?: React.ReactNode
  size?: "sm" | "md"
}

function CardChip({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 shadow-inner",
        compact ? "h-5 w-7" : "h-7 w-9"
      )}
      aria-hidden
    >
      <div
        className={cn(
          "grid h-full w-full grid-cols-2 gap-px p-0.5 opacity-40",
          compact ? "p-px" : "p-0.5"
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[1px] bg-amber-900/30" />
        ))}
      </div>
    </div>
  )
}

export function CardVisual({
  cardId,
  bankName,
  cardName,
  styleClasses,
  bankId,
  bankLogoUrl,
  cardImageUrl,
  className,
  subtitle,
  size = "md",
}: CardVisualProps) {
  const artUrl = resolveCardImageUrl(cardId, cardImageUrl)
  const compact = size === "sm"

  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] overflow-hidden rounded-2xl shadow-lg shadow-black/30",
        "flex flex-col justify-between border border-white/15",
        !artUrl && styleClasses,
        className
      )}
    >
      {artUrl ? (
        <>
          <img
            src={artUrl}
            alt={`${bankName} ${cardName}`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/50" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30" />
          <div
            className="pointer-events-none absolute -right-8 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            aria-hidden
          />
        </>
      )}

      <div
        className={cn(
          "relative flex items-start justify-between gap-2",
          compact ? "p-2.5" : "p-3.5"
        )}
      >
        <CardChip compact={compact} />
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md bg-white px-1.5 py-1 shadow-md",
            compact ? "min-h-[1.25rem] min-w-[2.75rem]" : "min-h-[1.5rem] min-w-[3.25rem]"
          )}
        >
          <BankLogo
            bankName={bankName}
            bankId={bankId}
            logoUrl={bankLogoUrl}
            className={cn(compact ? "h-3.5 max-w-[2.5rem]" : "h-4 max-w-[3rem]")}
            imageClassName={cn(
              "object-contain",
              compact ? "h-3.5 max-w-[2.5rem]" : "h-4 max-w-[3rem]"
            )}
          />
        </div>
      </div>

      <div className={cn("relative min-w-0", compact ? "px-2.5 pb-2.5" : "px-3.5 pb-3.5")}>
        <p
          className={cn(
            "truncate font-semibold tracking-tight text-white drop-shadow-md",
            compact ? "text-[11px]" : "text-sm"
          )}
        >
          {cardName}
        </p>
        {subtitle ? (
          <div
            className={cn(
              "mt-1 font-mono leading-tight text-white/85 drop-shadow",
              compact ? "text-[9px]" : "text-[10px]"
            )}
          >
            {subtitle}
          </div>
        ) : (
          <p
            className={cn(
              "mt-1 font-mono tracking-[0.2em] text-white/75 drop-shadow",
              compact ? "text-[9px]" : "text-[10px]"
            )}
          >
            •••• •••• •••• 4242
          </p>
        )}
        <p
          className={cn(
            "absolute bottom-2.5 right-2.5 font-bold italic text-white/40",
            compact ? "text-[8px]" : "text-[9px]"
          )}
        >
          VISA
        </p>
      </div>
    </div>
  )
}
