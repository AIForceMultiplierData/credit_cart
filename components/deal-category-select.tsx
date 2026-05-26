"use client"

import { Hotel, Package, Plane } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DealSearchCategory } from "@/lib/deal-search"
import { cn } from "@/lib/utils"

export const DEAL_CATEGORY_OPTIONS: Array<{
  value: DealSearchCategory
  label: string
  icon: typeof Plane
}> = [
  { value: "product", label: "Product", icon: Package },
  { value: "flight", label: "Flight", icon: Plane },
  { value: "hotels", label: "Hotels", icon: Hotel },
]

type DealCategorySelectProps = {
  value: DealSearchCategory
  onValueChange: (value: DealSearchCategory) => void
  className?: string
  triggerClassName?: string
}

export function DealCategorySelect({
  value,
  onValueChange,
  className,
  triggerClassName,
}: DealCategorySelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as DealSearchCategory)}>
      <SelectTrigger
        className={cn(
          "h-11 w-full border-slate-700/80 bg-slate-950/80 text-slate-50",
          "focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30",
          triggerClassName
        )}
      >
        <SelectValue placeholder="Choose category" />
      </SelectTrigger>
      <SelectContent className="border-slate-800 bg-slate-900 text-slate-50">
        {DEAL_CATEGORY_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-400" />
                {option.label}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
