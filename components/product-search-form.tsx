"use client"

import { ChevronDown, Link2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  defaultProductSearchParams,
  PRODUCT_SORT_OPTIONS,
  type ProductSearchParams,
} from "@/lib/product-search"
import { cn } from "@/lib/utils"

type ProductSearchFormProps = {
  value?: ProductSearchParams
  onChange?: (params: ProductSearchParams) => void
}

export function ProductSearchForm({
  value = defaultProductSearchParams(),
  onChange,
}: ProductSearchFormProps) {
  const set = (patch: Partial<ProductSearchParams>) => {
    onChange?.({ ...value, ...patch })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
          What are you looking for?
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
          <Input
            type="search"
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="e.g. Acer Aspire 7 laptop, iPhone 16, Nike shoes…"
            className="h-11 border-slate-700 bg-slate-950 pl-10 text-slate-50"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          We find the same product on Amazon, Flipkart, Myntra & more — then rank
          your wallet + circle cards per store.
        </p>
      </div>

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-900/60">
          <span className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-slate-500" />
            Or paste a product link (optional)
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <Input
            type="url"
            value={value.pastedUrl ?? ""}
            onChange={(e) =>
              set({ pastedUrl: e.target.value.trim() || null })
            }
            placeholder="https://www.amazon.in/… or Flipkart link"
            className="h-11 border-slate-700 bg-slate-950 text-slate-50"
          />
        </CollapsibleContent>
      </Collapsible>

      <div>
        <Label className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
          Rank by
        </Label>
        <Select
          value={value.sort}
          onValueChange={(v) =>
            set({ sort: v as ProductSearchParams["sort"] })
          }
        >
          <SelectTrigger className="h-11 border-slate-700 bg-slate-950 text-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-slate-800 bg-slate-900 text-slate-50">
            {PRODUCT_SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "rounded-xl border border-amber-500/25 bg-amber-500/5 p-3"
        )}
      >
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
          Price (optional)
        </Label>
        <p className="mb-2 text-[11px] text-slate-500">
          Pick a store below after search, or paste checkout price (₹).
        </p>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            ₹
          </span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={value.estimatedPrice ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value)
              set({
                estimatedPrice:
                  Number.isFinite(n) && n > 0 ? Math.round(n) : null,
              })
            }}
            placeholder="e.g. 8499"
            className="h-11 border-slate-700 bg-slate-950 pl-8 text-slate-50"
          />
        </div>
      </div>
    </div>
  )
}
