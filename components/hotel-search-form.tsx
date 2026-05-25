"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ChevronDown, Minus, Plus, SlidersHorizontal } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  defaultHotelSearchParams,
  formatHotelDate,
  guestSummary,
  HOTEL_CHAIN_OPTIONS,
  HOTEL_SORT_OPTIONS,
  INDIAN_HOTEL_CITIES,
  type HotelSearchParams,
} from "@/lib/hotel-search"
import { cn } from "@/lib/utils"

type HotelSearchFormProps = {
  value?: HotelSearchParams
  onChange?: (params: HotelSearchParams) => void
}

function CityField({
  code,
  city,
  onSelect,
}: {
  code: string
  city: string
  onSelect: (code: string, city: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return INDIAN_HOTEL_CITIES
    return INDIAN_HOTEL_CITIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between border-slate-700 bg-slate-950 text-left font-normal text-slate-100"
        >
          <span className="truncate">
            <span className="font-semibold">{city}</span>
            <span className="ml-2 text-slate-400">{code}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] border-slate-800 bg-slate-900 p-2"
        align="start"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city…"
          className="mb-2 h-9 border-slate-700 bg-slate-950"
        />
        <div className="max-h-48 overflow-y-auto">
          {matches.map((row) => (
            <button
              key={row.code}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-800"
              onClick={() => {
                onSelect(row.code, row.city)
                setOpen(false)
                setQuery("")
              }}
            >
              <span className="font-medium text-slate-100">{row.city}</span>
              <span className="text-slate-500">{row.code}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DateField({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string
  value: string
  onChange: (iso: string) => void
  minDate?: Date
}) {
  const selected = value ? new Date(`${value}T12:00:00`) : undefined

  return (
    <div className="min-w-0 flex-1">
      <Label className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-start border-slate-700 bg-slate-950 text-slate-100"
          >
            <CalendarDays className="mr-2 h-4 w-4 text-emerald-400" />
            {value ? formatHotelDate(value) : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto border-slate-800 bg-slate-900 p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) onChange(format(day, "yyyy-MM-dd"))
            }}
            disabled={minDate ? { before: minDate } : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function Counter({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string
  hint: string
  value: number
  min: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-100">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full border-slate-600"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full border-slate-600"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function HotelSearchForm({ value, onChange }: HotelSearchFormProps) {
  const [params, setParams] = useState<HotelSearchParams>(
    value ?? defaultHotelSearchParams()
  )
  const [filtersOpen, setFiltersOpen] = useState(false)

  function patch(partial: Partial<HotelSearchParams>) {
    const next = { ...params, ...partial }
    setParams(next)
    onChange?.(next)
  }

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const checkOutMin = params.checkIn
    ? new Date(`${params.checkIn}T12:00:00`)
    : today

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
          Destination
        </Label>
        <CityField
          code={params.cityCode}
          city={params.city}
          onSelect={(cityCode, city) => patch({ cityCode, city })}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <DateField
          label="Check-in"
          value={params.checkIn}
          onChange={(checkIn) => patch({ checkIn })}
          minDate={today}
        />
        <DateField
          label="Check-out"
          value={params.checkOut}
          onChange={(checkOut) => patch({ checkOut })}
          minDate={checkOutMin}
        />
      </div>

      <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
        <Counter
          label="Rooms"
          hint="Number of rooms"
          value={params.rooms}
          min={1}
          onChange={(rooms) => patch({ rooms })}
        />
        <Counter
          label="Adults"
          hint="12+ years"
          value={params.guests.adults}
          min={1}
          onChange={(adults) =>
            patch({ guests: { ...params.guests, adults } })
          }
        />
        <Counter
          label="Children"
          hint="2–12 years"
          value={params.guests.children}
          min={0}
          onChange={(children) =>
            patch({ guests: { ...params.guests, children } })
          }
        />
        <p className="mt-2 text-xs text-slate-400">
          {guestSummary(params.guests, params.rooms)}
        </p>
      </div>

      <Select
        value={params.sort}
        onValueChange={(sort) =>
          patch({ sort: sort as HotelSearchParams["sort"] })
        }
      >
        <SelectTrigger className="h-11 w-full border-slate-700 bg-slate-950">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="border-slate-800 bg-slate-900">
          {HOTEL_SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
        <Label className="text-xs font-semibold text-amber-200/90">
          Total stay price (optional)
        </Label>
        <p className="mb-2 mt-1 text-[11px] text-slate-400">
          Pick a hotel below after search, or paste all-in total from
          MakeMyTrip / Booking.com.
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            ₹
          </span>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 12499"
            value={params.estimatedTotal ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value)
              patch({
                estimatedTotal:
                  e.target.value === "" || !Number.isFinite(n)
                    ? null
                    : Math.round(n),
              })
            }}
            className="h-11 border-slate-700 bg-slate-950 pl-8 font-mono"
          />
        </div>
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between border-slate-700 bg-slate-950"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                filtersOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-4 rounded-xl border border-slate-800/60 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-200">Hide non-refundable</Label>
            <Switch
              checked={params.filters.hideNonRefundable}
              onCheckedChange={(hideNonRefundable) =>
                patch({ filters: { ...params.filters, hideNonRefundable } })
              }
            />
          </div>

          <div>
            <Label className="mb-2 text-xs uppercase text-slate-500">
              Min stars
            </Label>
            <Select
              value={String(params.filters.minStars)}
              onValueChange={(v) =>
                patch({
                  filters: { ...params.filters, minStars: Number(v) },
                })
              }
            >
              <SelectTrigger className="border-slate-700 bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900">
                <SelectItem value="0">Any</SelectItem>
                <SelectItem value="3">3★+</SelectItem>
                <SelectItem value="4">4★+</SelectItem>
                <SelectItem value="5">5★ only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-slate-500">Chains</Label>
            {HOTEL_CHAIN_OPTIONS.map((chain) => {
              const checked = params.filters.chains.includes(chain.id)
              return (
                <label
                  key={chain.id}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(on) => {
                      const chains = on
                        ? [...params.filters.chains, chain.id]
                        : params.filters.chains.filter((id) => id !== chain.id)
                      patch({ filters: { ...params.filters, chains } })
                    }}
                  />
                  {chain.label}
                </label>
              )
            })}
          </div>

          <div>
            <Label className="mb-2 text-xs text-slate-400">Max price / stay</Label>
            <Slider
              min={3000}
              max={80000}
              step={1000}
              value={[params.filters.maxPrice ?? 50000]}
              onValueChange={([v]) =>
                patch({
                  filters: {
                    ...params.filters,
                    maxPrice: v >= 80000 ? null : v,
                  },
                })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
