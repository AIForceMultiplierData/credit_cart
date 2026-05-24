"use client"

import { Cpu } from "lucide-react"
import { BankLogo } from "@/components/bank-logo"
import { cn } from "@/lib/utils"

type CardCatalogThumbnailProps = {
  bankName: string
  cardName: string
  styleClasses: string
  bankId?: string | null
  bankLogoUrl?: string | null
  className?: string
  subtitle?: React.ReactNode
}

export function CardCatalogThumbnail({
  bankName,
  cardName,
  styleClasses,
  bankId,
  bankLogoUrl,
  className,
  subtitle,
}: CardCatalogThumbnailProps) {
  return (
    <div
      className={cn(
        "relative aspect-[1.58/1] overflow-hidden rounded-xl p-2 shadow-md",
        "flex flex-col justify-between border border-white/10",
        styleClasses,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
      <div className="relative flex items-start justify-between gap-1">
        <div className="flex h-5 w-6 shrink-0 items-center justify-center rounded bg-white/20 backdrop-blur-sm">
          <Cpu className="h-2.5 w-2.5 opacity-90" aria-hidden />
        </div>
        <BankLogo
          bankName={bankName}
          bankId={bankId}
          logoUrl={bankLogoUrl}
          className="h-4 max-w-[3.25rem]"
          imageClassName="h-4 w-auto max-w-[3.25rem]"
        />
      </div>
      <div className="relative min-w-0">
        <p className="truncate text-[10px] font-bold leading-tight">{cardName}</p>
        {subtitle ? (
          <div className="mt-0.5 text-[8px] leading-tight opacity-90">{subtitle}</div>
        ) : (
          <p className="mt-0.5 font-mono text-[7px] tracking-wider opacity-60">
            •••• 4242
          </p>
        )}
      </div>
    </div>
  )
}
