"use client"

import { BankLogo } from "@/components/bank-logo"
import { resolveCardImageUrl } from "@/lib/card-photo-registry"
import { cn } from "@/lib/utils"

const CARD_TEXTURE =
  "https://www.transparenttextures.com/patterns/cubes.png"

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

function EmvChip({ compact }: { compact?: boolean }) {
  return (
    <svg
      className={cn("shrink-0 text-yellow-400/80 drop-shadow", compact ? "h-6 w-8" : "h-8 w-10")}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M4 4h16v16H4V4zm2 2v3h3V6H6zm5 0v3h2V6h-2zm4 0v3h3V6h-3zM6 11v2h3v-2H6zm9 0v2h3v-2h-3zM6 15v3h3v-3H6zm5 0v3h2v-3h-2zm4 0v3h3v-3h-3z" />
    </svg>
  )
}

function BrochureOverlays({ photo }: { photo?: boolean }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay bg-[length:200px_200px]"
        style={{ backgroundImage: `url('${CARD_TEXTURE}')` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -skew-x-12 translate-x-10 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
        aria-hidden
      />
      {photo ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/50" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />
      )}
    </>
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
        "relative aspect-[1.586/1] overflow-hidden rounded-2xl shadow-2xl shadow-black/35",
        "flex flex-col justify-between border border-white/20 backdrop-blur-[1px]",
        !artUrl && styleClasses,
        className
      )}
    >
      {artUrl ? (
        <img
          src={artUrl}
          alt={`${bankName} ${cardName}`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      <BrochureOverlays photo={Boolean(artUrl)} />

      <div
        className={cn(
          "relative z-10 flex items-start justify-between gap-2",
          compact ? "p-2.5" : "p-3.5"
        )}
      >
        <EmvChip compact={compact} />
        <div className="flex min-w-0 flex-col items-end gap-0.5">
          <BankLogo
            bankName={bankName}
            bankId={bankId}
            logoUrl={bankLogoUrl}
            showFallbackInitial
            className={cn(
              "drop-shadow-md",
              compact ? "h-4 max-w-[3.5rem]" : "h-5 max-w-[4rem]"
            )}
            imageClassName={cn(
              "object-contain object-right brightness-110",
              compact ? "h-4 max-w-[3.5rem]" : "h-5 max-w-[4rem]"
            )}
          />
          <span
            className={cn(
              "truncate font-bold uppercase tracking-wider text-white/80 drop-shadow",
              compact ? "max-w-[4.5rem] text-[8px]" : "max-w-[5rem] text-[10px]"
            )}
          >
            {bankName}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 flex min-w-0 flex-1 flex-col justify-end",
          compact ? "px-2.5 pb-2.5" : "px-3.5 pb-3.5"
        )}
      >
        <h3
          className={cn(
            "truncate font-bold tracking-wide text-white drop-shadow-md",
            compact ? "text-[11px]" : "text-sm"
          )}
        >
          {cardName}
        </h3>
        <div className="mt-1 flex items-end justify-between gap-2">
          {subtitle ? (
            <div
              className={cn(
                "min-w-0 font-mono leading-tight text-white/85 drop-shadow",
                compact ? "text-[9px]" : "text-[10px]"
              )}
            >
              {subtitle}
            </div>
          ) : (
            <p
              className={cn(
                "font-mono tracking-[0.2em] text-white/75 drop-shadow",
                compact ? "text-[9px]" : "text-[10px]"
              )}
            >
              •••• •••• •••• 4242
            </p>
          )}
          <span
            className={cn(
              "shrink-0 font-bold italic text-white/80 drop-shadow-md",
              compact ? "text-[9px]" : "text-xs"
            )}
          >
            VISA
          </span>
        </div>
      </div>
    </div>
  )
}
