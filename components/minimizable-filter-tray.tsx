"use client"

import { ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type MinimizableFilterTrayProps = {
  label: string
  summary: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function MinimizableFilterTray({
  label,
  summary,
  open,
  onOpenChange,
  children,
  className,
}: MinimizableFilterTrayProps) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn("min-w-0", className)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-slate-800/50 bg-slate-950/60 px-3 text-left backdrop-blur-md transition-colors hover:bg-slate-900/80"
        >
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {label}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
            {summary}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-500 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 min-w-0 overflow-hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
