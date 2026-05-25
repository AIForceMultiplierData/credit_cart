"use client"

import { useState } from "react"
import { Building2 } from "lucide-react"
import { getBankLogoUrl } from "@/lib/bank-registry"
import { cn } from "@/lib/utils"

type BankLogoProps = {
  bankName: string
  bankId?: string | null
  logoUrl?: string | null
  className?: string
  imageClassName?: string
  showFallbackInitial?: boolean
}

export function BankLogo({
  bankName,
  bankId,
  logoUrl,
  className,
  imageClassName,
  showFallbackInitial = false,
}: BankLogoProps) {
  const [failed, setFailed] = useState(false)
  const src = getBankLogoUrl(bankName, logoUrl)

  if (failed) {
    if (showFallbackInitial) {
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-md bg-white/15 font-bold uppercase text-white/90",
            className
          )}
          aria-label={bankName}
        >
          {bankName.slice(0, 3)}
        </span>
      )
    }

    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-white/15 text-white/80",
          className
        )}
        aria-label={bankName}
      >
        <Building2 className={cn("h-3.5 w-3.5", imageClassName)} aria-hidden />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={`${bankName} logo`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(
        "object-contain object-left",
        className,
        imageClassName
      )}
    />
  )
}
