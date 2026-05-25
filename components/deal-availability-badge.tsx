"use client"

import { Radio, UserPlus, Wallet } from "lucide-react"
import {
  DEAL_AVAILABILITY_META,
  type DealAvailability,
} from "@/lib/deal-availability"
import { cn } from "@/lib/utils"

const ICONS = {
  wallet: Wallet,
  circle: UserPlus,
  ping_to_split: Radio,
} as const

export function DealAvailabilityBadge({
  availability,
  className,
}: {
  availability: DealAvailability
  className?: string
}) {
  const meta = DEAL_AVAILABILITY_META[availability]
  const Icon = ICONS[availability]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        meta.badgeClass,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {meta.label}
    </span>
  )
}
