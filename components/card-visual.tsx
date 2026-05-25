"use client"

import { Cpu } from "lucide-react"
import { BankLogo } from "@/components/bank-logo"
import { getCardArtUrl } from "@/lib/card-art-registry"
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
  const artUrl = getCardArtUrl(cardId, cardImageUrl)
  const compact = size === "sm"

  return (
    <div
      className={cn(
        "relative aspect-[1.58/1] overflow-hidden rounded-xl shadow-md",
        "flex flex-col justify-between border border-white/10",
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
      )}

      <div
        className={cn(
          "relative flex items-start justify-between gap-1",
          compact ? "p-2" : "p-3"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded bg-white/25 backdrop-blur-sm",
            compact ? "h-5 w-6" : "h-6 w-8"
          )}
        >
          <Cpu
            className={cn("opacity-90", compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5")}
            aria-hidden
          />
        </div>
        <BankLogo
          bankName={bankName}
          bankId={bankId}
          logoUrl={bankLogoUrl}
          className={cn(
            "drop-shadow-md",
            compact ? "h-4 max-w-[3.25rem]" : "h-5 max-w-[4rem]"
          )}
          imageClassName={cn(
            "object-contain drop-shadow",
            compact ? "h-4 max-w-[3.25rem]" : "h-5 max-w-[4rem]"
          )}
        />
      </div>

      <div className={cn("relative min-w-0", compact ? "px-2 pb-2" : "px-3 pb-3")}>
        <p
          className={cn(
            "truncate font-bold leading-tight text-white drop-shadow",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {cardName}
        </p>
        {subtitle ? (
          <div
            className={cn(
              "mt-0.5 leading-tight text-white/90 drop-shadow",
              compact ? "text-[8px]" : "text-[9px]"
            )}
          >
            {subtitle}
          </div>
        ) : (
          <p
            className={cn(
              "mt-0.5 font-mono tracking-wider text-white/70",
              compact ? "text-[7px]" : "text-[8px]"
            )}
          >
            •••• 4242
          </p>
        )}
      </div>
    </div>
  )
}
