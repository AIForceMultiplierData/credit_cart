"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { PlaceDetails, PlaceSuggestion } from "@/lib/google-places"
import { cn } from "@/lib/utils"

export type HotelDestinationValue = {
  destination: string
  placeId: string | null
  lat: number | null
  lng: number | null
  destinationConfirmed: boolean
}

type HotelDestinationSearchProps = {
  value: HotelDestinationValue
  onChange: (next: HotelDestinationValue) => void
  onConfirmed?: () => void
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export function HotelDestinationSearch({
  value,
  onChange,
  onConfirmed,
}: HotelDestinationSearchProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [pending, setPending] = useState<PlaceDetails | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [mapExpanded, setMapExpanded] = useState(true)
  const [confirmedEmbed, setConfirmedEmbed] = useState<string | null>(null)
  const [confirmedMapOpen, setConfirmedMapOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebouncedValue(query, 280)

  useEffect(() => {
    if (!value.destinationConfirmed) return
    setQuery(value.destination)
  }, [value.destination, value.destinationConfirmed])

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSuggestions([])
      return
    }
    if (
      value.destinationConfirmed &&
      debouncedQuery === value.destination
    ) {
      return
    }

    let cancelled = false
    setLoading(true)
    setApiError(null)

    fetch(
      `/api/places/autocomplete?q=${encodeURIComponent(debouncedQuery)}`
    )
      .then((r) => r.json())
      .then((body: { suggestions?: PlaceSuggestion[]; error?: string }) => {
        if (cancelled) return
        if (body.error) setApiError(body.error)
        setSuggestions(body.suggestions ?? [])
        setOpen(true)
      })
      .catch(() => {
        if (!cancelled) setApiError("Could not load suggestions")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, value.destination, value.destinationConfirmed])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const loadPlace = useCallback(async (placeId: string) => {
    setDetailsLoading(true)
    setApiError(null)
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(placeId)}`
      )
      const body = await res.json()
      if (!res.ok) {
        setApiError(body.error ?? "Could not load place")
        return
      }
      const details = body.details as PlaceDetails
      setPending(details)
      setEmbedUrl(body.embedUrl as string)
      setMapExpanded(true)
      onChange({
        destination: details.name || details.formattedAddress,
        placeId: details.placeId,
        lat: details.lat,
        lng: details.lng,
        destinationConfirmed: false,
      })
    } finally {
      setDetailsLoading(false)
    }
  }, [onChange])

  function selectSuggestion(s: PlaceSuggestion) {
    setQuery(s.description)
    setOpen(false)
    setSuggestions([])
    void loadPlace(s.placeId)
  }

  function confirmDestination() {
    if (!pending) return
    onChange({
      destination: pending.name || pending.formattedAddress,
      placeId: pending.placeId,
      lat: pending.lat,
      lng: pending.lng,
      destinationConfirmed: true,
    })
    setConfirmedEmbed(embedUrl)
    setConfirmedMapOpen(false)
    setPending(null)
    setEmbedUrl(null)
    setMapExpanded(false)
    setQuery(pending.name || pending.formattedAddress)
    onConfirmed?.()
  }

  function clearSelection() {
    setConfirmedEmbed(null)
    setConfirmedMapOpen(false)
    setPending(null)
    setEmbedUrl(null)
    setQuery("")
    onChange({
      destination: "",
      placeId: null,
      lat: null,
      lng: null,
      destinationConfirmed: false,
    })
  }

  const showMapPreview = Boolean(pending && embedUrl)
  const showConfirmedBar =
    value.destinationConfirmed && value.placeId && !pending

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={query}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            if (value.destinationConfirmed) {
              onChange({
                destination: "",
                placeId: null,
                lat: null,
                lng: null,
                destinationConfirmed: false,
              })
            }
            setPending(null)
            setEmbedUrl(null)
          }}
          onFocus={() => {
            if (suggestions.length) setOpen(true)
          }}
          placeholder="City, state, landmark, hotel…"
          className="h-11 border-slate-700 bg-slate-950 pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-400" />
        )}
      </div>

      {apiError && (
        <p className="text-[11px] text-amber-400/90">{apiError}</p>
      )}

      {open && suggestions.length > 0 && (
        <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              className="flex w-full flex-col rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-800"
              onClick={() => selectSuggestion(s)}
            >
              <span className="font-medium text-slate-100">{s.mainText}</span>
              {s.secondaryText ? (
                <span className="text-xs text-slate-500">{s.secondaryText}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {showMapPreview && (
        <div className="overflow-hidden rounded-xl border border-emerald-500/30 bg-slate-950/80">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="text-xs font-medium text-emerald-200/90">
              Confirm destination
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-slate-400"
              onClick={() => setMapExpanded((v) => !v)}
            >
              {mapExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          {mapExpanded && (
            <iframe
              title="Destination map preview"
              src={embedUrl!}
              className="h-40 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          <div className="space-y-2 p-3">
            <p className="text-sm text-slate-200">
              {pending!.name}
            </p>
            <p className="text-xs text-slate-500">
              {pending!.formattedAddress}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                disabled={detailsLoading}
                onClick={confirmDestination}
              >
                <Check className="mr-1 h-4 w-4" />
                Confirm
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-slate-700"
                onClick={() => {
                  setPending(null)
                  setEmbedUrl(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showConfirmedBar && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">
                {value.destination}
              </p>
            </div>
            {confirmedEmbed ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-slate-400"
                onClick={() => setConfirmedMapOpen((v) => !v)}
              >
                {confirmedMapOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 text-xs text-slate-400"
              onClick={clearSelection}
            >
              Change
            </Button>
          </div>
          {confirmedEmbed && confirmedMapOpen && (
            <iframe
              title="Confirmed destination map"
              src={confirmedEmbed}
              className="h-28 w-full border-0 border-t border-slate-800"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
      )}
    </div>
  )
}
