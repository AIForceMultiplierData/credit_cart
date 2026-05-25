"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeftRight,
  CalendarDays,
  ChevronDown,
  Minus,
  Plus,
  SlidersHorizontal,
  Users,
} from "lucide-react"
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
  defaultFlightSearchParams,
  FLIGHT_AIRLINE_OPTIONS,
  FLIGHT_CABIN_OPTIONS,
  FLIGHT_SORT_OPTIONS,
  FLIGHT_TIME_SLOTS,
  formatFlightDate,
  passengerSummary,
  type FlightSearchParams,
} from "@/lib/flight-search"
import { MinimizableFilterTray } from "@/components/minimizable-filter-tray"
import { filterAirports } from "@/lib/indian-airports"
import { useIndianAirports } from "@/hooks/useIndianAirports"
import { useMinimizableTray } from "@/hooks/useMinimizableTray"
import { cn } from "@/lib/utils"

type FlightSearchFormProps = {
  value?: FlightSearchParams
  onChange?: (params: FlightSearchParams) => void
}

function AirportField({
  label,
  code,
  city,
  onSelect,
  onAfterSelect,
}: {
  label: string
  code: string
  city: string
  onSelect: (code: string, city: string) => void
  onAfterSelect?: () => void
}) {
  const { airports, loading } = useIndianAirports()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const matches = useMemo(
    () => filterAirports(airports, query),
    [airports, query]
  )

  return (
    <div className="min-w-0 flex-1">
      <Label className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-between border-slate-700 bg-slate-950 text-left font-normal text-slate-100 hover:bg-slate-900"
          >
            <span className="truncate">
              <span className="font-semibold">{code}</span>
              <span className="ml-2 text-slate-400">{city}</span>
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
            placeholder="Search city or code…"
            className="mb-2 h-9 border-slate-700 bg-slate-950"
          />
          <div className="max-h-48 overflow-y-auto">
            {loading && matches.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500">Loading airports…</p>
            ) : null}
            {matches.map((airport) => (
              <button
                key={airport.code}
                type="button"
                className="flex w-full flex-col rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-800"
                onClick={() => {
                  onSelect(airport.code, airport.city)
                  setOpen(false)
                  setQuery("")
                  onAfterSelect?.()
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-100">{airport.city}</span>
                  <span className="text-slate-500">{airport.code}</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {airport.airportName}
                  {airport.state ? ` · ${airport.state}` : ""}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function DatePickerField({
  label,
  value,
  onChange,
  onAfterSelect,
  minDate,
  disabled,
}: {
  label: string
  value: string
  onChange: (iso: string) => void
  onAfterSelect?: () => void
  minDate?: Date
  disabled?: boolean
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
            disabled={disabled}
            className="h-11 w-full justify-start border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
          >
            <CalendarDays className="mr-2 h-4 w-4 text-emerald-400" />
            {value ? formatFlightDate(value) : "Select date"}
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
              if (day) {
                onChange(format(day, "yyyy-MM-dd"))
                onAfterSelect?.()
              }
            }}
            disabled={minDate ? { before: minDate } : undefined}
            className="rounded-md"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function TravellerCounter({
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

export function FlightSearchForm({ value, onChange }: FlightSearchFormProps) {
  const [params, setParams] = useState<FlightSearchParams>(
    value ?? defaultFlightSearchParams()
  )
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [paxOpen, setPaxOpen] = useState(false)
  const routeTray = useMinimizableTray("flight-route")
  const datesTray = useMinimizableTray("flight-dates")
  const timeTray = useMinimizableTray("flight-time")

  const routeSummary = `${params.originCode} ${params.origin} → ${params.destinationCode} ${params.destination}`
  const datesSummary =
    params.tripType === "return" && params.returnDate
      ? `${formatFlightDate(params.departDate)} – ${formatFlightDate(params.returnDate)}`
      : formatFlightDate(params.departDate)
  const timeSummary =
    FLIGHT_TIME_SLOTS.find((s) => s.id === params.timeSlot)?.label ?? "Any time"

  function patch(partial: Partial<FlightSearchParams>) {
    const next = { ...params, ...partial }
    setParams(next)
    onChange?.(next)
  }

  function swapRoute() {
    patch({
      origin: params.destination,
      originCode: params.destinationCode,
      destination: params.origin,
      destinationCode: params.originCode,
    })
  }

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const returnMin = params.departDate
    ? new Date(`${params.departDate}T12:00:00`)
    : today

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-xl border border-slate-700/80 bg-slate-950/80 p-1">
        {(["oneway", "return"] as const).map((trip) => (
          <button
            key={trip}
            type="button"
            onClick={() =>
              patch({
                tripType: trip,
                returnDate: trip === "oneway" ? null : params.returnDate,
              })
            }
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              params.tripType === trip
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {trip === "oneway" ? "Single" : "Return"}
          </button>
        ))}
      </div>

      <MinimizableFilterTray
        label="Route"
        summary={routeSummary}
        open={routeTray.open}
        onOpenChange={routeTray.setOpen}
      >
        <div className="flex items-end gap-2">
          <AirportField
            label="From"
            code={params.originCode}
            city={params.origin}
            onSelect={(code, city) => patch({ originCode: code, origin: city })}
            onAfterSelect={routeTray.collapse}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="mb-0.5 h-11 w-11 shrink-0 border-slate-700 bg-slate-950"
            onClick={() => {
              swapRoute()
              routeTray.collapse()
            }}
            aria-label="Swap airports"
          >
            <ArrowLeftRight className="h-4 w-4 text-slate-300" />
          </Button>
          <AirportField
            label="To"
            code={params.destinationCode}
            city={params.destination}
            onSelect={(code, city) =>
              patch({ destinationCode: code, destination: city })
            }
            onAfterSelect={routeTray.collapse}
          />
        </div>
      </MinimizableFilterTray>

      <MinimizableFilterTray
        label="Dates"
        summary={datesSummary}
        open={datesTray.open}
        onOpenChange={datesTray.setOpen}
      >
        <div
          className={cn(
            "grid gap-2",
            params.tripType === "return"
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1"
          )}
        >
          <DatePickerField
            label={params.tripType === "return" ? "Depart" : "Travel date"}
            value={params.departDate}
            onChange={(departDate) => patch({ departDate })}
            onAfterSelect={
              params.tripType === "return" ? undefined : datesTray.collapse
            }
            minDate={today}
          />
          {params.tripType === "return" ? (
            <DatePickerField
              label="Return"
              value={params.returnDate ?? ""}
              onChange={(returnDate) => patch({ returnDate })}
              onAfterSelect={datesTray.collapse}
              minDate={returnMin}
            />
          ) : null}
        </div>
      </MinimizableFilterTray>

      <MinimizableFilterTray
        label="Departure"
        summary={timeSummary}
        open={timeTray.open}
        onOpenChange={timeTray.setOpen}
      >
        <div className="grid grid-cols-3 gap-2">
          {FLIGHT_TIME_SLOTS.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => {
                patch({ timeSlot: slot.id })
                timeTray.collapse()
              }}
              className={cn(
                "min-w-0 rounded-lg border px-2 py-2 text-center transition-colors",
                params.timeSlot === slot.id
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-slate-700 bg-slate-950/60 text-slate-400 hover:border-slate-600"
              )}
            >
              <span className="block text-xs font-semibold">{slot.label}</span>
              <span className="block text-[10px] opacity-70">{slot.hint}</span>
            </button>
          ))}
        </div>
      </MinimizableFilterTray>

      <div className="min-w-0 space-y-2">
        <Popover open={paxOpen} onOpenChange={setPaxOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 justify-start border-slate-700 bg-slate-950 text-slate-100"
            >
              <Users className="mr-2 h-4 w-4 text-blue-400" />
              {passengerSummary(params.passengers, params.cabinClass)}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(100vw-2rem,360px)] border-slate-800 bg-slate-900 p-4"
            align="start"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Passenger &amp; class
            </p>
            <div className="mb-4 rounded-xl bg-slate-950/60 p-3">
              <TravellerCounter
                label="Adults"
                hint="12+ years"
                value={params.passengers.adults}
                min={1}
                onChange={(adults) =>
                  patch({ passengers: { ...params.passengers, adults } })
                }
              />
              <TravellerCounter
                label="Children"
                hint="2–12 years"
                value={params.passengers.children}
                min={0}
                onChange={(children) =>
                  patch({ passengers: { ...params.passengers, children } })
                }
              />
              <TravellerCounter
                label="Infants"
                hint="0–2 years"
                value={params.passengers.infants}
                min={0}
                onChange={(infants) =>
                  patch({ passengers: { ...params.passengers, infants } })
                }
              />
            </div>
            <div className="space-y-2">
              {FLIGHT_CABIN_OPTIONS.map((cabin) => (
                <button
                  key={cabin.id}
                  type="button"
                  onClick={() => patch({ cabinClass: cabin.id })}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm",
                    params.cabinClass === cabin.id
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                      : "border-slate-700 text-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border-2",
                      params.cabinClass === cabin.id
                        ? "border-blue-400 bg-blue-400"
                        : "border-slate-500"
                    )}
                  />
                  {cabin.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              className="mt-4 w-full bg-blue-500 hover:bg-blue-400"
              onClick={() => setPaxOpen(false)}
            >
              Done
            </Button>
          </PopoverContent>
        </Popover>

        <Select
          value={params.sort}
          onValueChange={(sort) =>
            patch({ sort: sort as FlightSearchParams["sort"] })
          }
        >
          <SelectTrigger className="h-11 w-full min-w-0 max-w-full border-slate-700 bg-slate-950">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="max-h-[min(280px,50vh)] border-slate-800 bg-slate-900"
          >
            {FLIGHT_SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
        <Label className="text-xs font-semibold text-amber-200/90">
          Total fare (optional)
        </Label>
        <p className="mb-2 mt-1 text-[11px] leading-relaxed text-slate-400">
          Pick a flight after search, or paste all-in fare from MakeMyTrip /
          Cleartrip checkout.
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            ₹
          </span>
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 8499"
            value={params.estimatedFare ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value)
              patch({
                estimatedFare:
                  e.target.value === "" || !Number.isFinite(n)
                    ? null
                    : Math.round(n),
              })
            }}
            className="h-11 border-slate-700 bg-slate-950 pl-8 font-mono text-slate-50"
          />
        </div>
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between border-slate-700 bg-slate-950 text-slate-300"
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
        <CollapsibleContent className="mt-2 space-y-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
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
            <Label className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              Airlines
            </Label>
            <div className="space-y-2">
              {FLIGHT_AIRLINE_OPTIONS.map((airline) => {
                const checked = params.filters.airlines.includes(airline.id)
                return (
                  <label
                    key={airline.id}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1 hover:bg-slate-900/60"
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(on) => {
                          const airlines = on
                            ? [...params.filters.airlines, airline.id]
                            : params.filters.airlines.filter(
                                (id) => id !== airline.id
                              )
                          patch({ filters: { ...params.filters, airlines } })
                        }}
                      />
                      {airline.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      from ₹{airline.from.toLocaleString("en-IN")}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-slate-400">Max price</Label>
              <span className="font-mono text-xs text-slate-300">
                {params.filters.maxPrice
                  ? `₹${params.filters.maxPrice.toLocaleString("en-IN")}`
                  : "No limit"}
              </span>
            </div>
            <Slider
              min={5000}
              max={50000}
              step={500}
              value={[params.filters.maxPrice ?? 35000]}
              onValueChange={([v]) =>
                patch({
                  filters: {
                    ...params.filters,
                    maxPrice: v >= 50000 ? null : v,
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

export function getFlightSearchParams(
  ref: FlightSearchParams | undefined,
  internal: FlightSearchParams
): FlightSearchParams {
  return ref ?? internal
}
