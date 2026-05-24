"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Cpu, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type CardCatalogRow = {
  card_id: string
  bank_name: string
  card_name: string
  style_classes: string
  is_active: boolean
}

export type WalletCardRecord = {
  card_id: string
  bank_name: string
  card_name: string
  style_classes: string
}

type CardCatalogSelect = Pick<
  CardCatalogRow,
  "card_id" | "bank_name" | "card_name" | "style_classes" | "is_active"
>

function isCardCatalogRow(value: unknown): value is CardCatalogRow {
  if (typeof value !== "object" || value === null) return false

  const row = value as Record<string, unknown>

  return (
    typeof row.card_id === "string" &&
    typeof row.bank_name === "string" &&
    typeof row.card_name === "string" &&
    typeof row.style_classes === "string" &&
    typeof row.is_active === "boolean"
  )
}

function parseCatalogRows(raw: unknown): CardCatalogRow[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isCardCatalogRow)
}

type AddCardModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  existingCardIds: string[]
  onAddToWallet: (card: WalletCardRecord) => Promise<void>
}

function CatalogCardPreview({
  card,
  selected,
  onSelect,
}: {
  card: CardCatalogRow
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full shrink-0 text-left transition-transform active:scale-[0.98]",
        selected &&
          "rounded-xl ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950"
      )}
    >
      <div
        className={cn(
          "relative aspect-[1.58/1] w-full overflow-hidden rounded-xl p-4 shadow-lg",
          "flex flex-col justify-between border border-white/10",
          card.style_classes
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-8 w-10 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
            <Cpu className="h-4 w-4 opacity-90" aria-hidden />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
            {card.bank_name}
          </span>
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">{card.card_name}</p>
          <p className="mt-1 font-mono text-[10px] tracking-widest opacity-60">
            •••• •••• •••• 4242
          </p>
        </div>
      </div>
    </button>
  )
}

export function AddCardModal({
  open,
  onOpenChange,
  saving,
  existingCardIds,
  onAddToWallet,
}: AddCardModalProps) {
  const [catalogData, setCatalogData] = useState<CardCatalogRow[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardCatalogRow | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchCatalog() {
      setCatalogLoading(true)
      setCatalogError(null)

      try {
        const { data, error } = await supabase
          .from("card_catalog")
          .select("card_id, bank_name, card_name, style_classes, is_active")
          .eq("is_active", true)
          .returns<CardCatalogSelect[]>()

        if (error) throw error

        if (cancelled) return

        setCatalogData(parseCatalogRows(data ?? []))
      } catch (err) {
        if (cancelled) return

        const message =
          err instanceof Error ? err.message : "Failed to load card catalog."
        setCatalogError(message)
        setCatalogData([])
        toast.error("Catalog unavailable", { description: message })
      } finally {
        if (!cancelled) {
          setCatalogLoading(false)
        }
      }
    }

    void fetchCatalog()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setSelectedBank(null)
      setSelectedCard(null)
    }
  }, [open])

  const banks = useMemo(
    () =>
      [...new Set(catalogData.map((row) => row.bank_name))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [catalogData]
  )

  const bankCards = useMemo(
    () =>
      selectedBank
        ? catalogData.filter((row) => row.bank_name === selectedBank)
        : [],
    [catalogData, selectedBank]
  )

  async function handleAddToWallet() {
    if (!selectedCard) return

    if (existingCardIds.includes(selectedCard.card_id)) {
      return
    }

    try {
      await onAddToWallet({
        card_id: selectedCard.card_id,
        bank_name: selectedCard.bank_name,
        card_name: selectedCard.card_name,
        style_classes: selectedCard.style_classes,
      })
      onOpenChange(false)
    } catch {
      // Save failed toast is shown in WalletView.updateWallet
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-slate-800 bg-slate-950/95 p-0 text-slate-50 backdrop-blur-xl sm:max-w-md">
        <div className="border-b border-slate-800/80 bg-slate-900/60 px-5 py-4 backdrop-blur-md">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-bold text-slate-50">
              {selectedBank ? `Choose ${selectedBank} Card` : "Select Your Bank"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedCard
                ? "Confirm and add this card to your trusted circle wallet."
                : selectedBank
                  ? "Scroll and tap the card that matches your wallet."
                  : "Pick a bank to browse the live card catalog."}
            </DialogDescription>
          </DialogHeader>
          {selectedBank && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 -ml-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              onClick={() => {
                setSelectedCard(null)
                setSelectedBank(null)
              }}
              disabled={saving || catalogLoading}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to banks
            </Button>
          )}
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {catalogLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="text-sm text-slate-400">Loading card catalog…</p>
            </div>
          ) : catalogError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center backdrop-blur-md">
              <p className="font-medium text-red-300">Could not load catalog</p>
              <p className="mt-1 text-sm text-slate-400">{catalogError}</p>
            </div>
          ) : catalogData.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center backdrop-blur-md">
              <p className="font-medium text-slate-300">No cards available</p>
              <p className="mt-1 text-sm text-slate-500">
                The catalog is empty. Add rows to card_catalog in Supabase.
              </p>
            </div>
          ) : !selectedBank ? (
            <div className="grid grid-cols-2 gap-3">
              {banks.map((bank) => (
                <Button
                  key={bank}
                  type="button"
                  variant="outline"
                  className="h-16 rounded-xl border-slate-700 bg-slate-900/40 text-base font-bold text-slate-100 hover:border-emerald-500/40 hover:bg-slate-800 hover:text-emerald-300"
                  onClick={() => setSelectedBank(bank)}
                >
                  {bank}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bankCards.map((card) => (
                <CatalogCardPreview
                  key={card.card_id}
                  card={card}
                  selected={selectedCard?.card_id === card.card_id}
                  onSelect={() => setSelectedCard(card)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedCard && (
          <div className="border-t border-slate-800/80 bg-slate-900/80 p-5 backdrop-blur-md">
            {existingCardIds.includes(selectedCard.card_id) ? (
              <p className="mb-3 text-center text-sm text-amber-400">
                This card is already in your wallet.
              </p>
            ) : null}
            <Button
              type="button"
              disabled={
                saving ||
                catalogLoading ||
                existingCardIds.includes(selectedCard.card_id)
              }
              onClick={() => void handleAddToWallet()}
              className="h-14 w-full rounded-xl border-0 bg-emerald-400 text-lg font-bold text-slate-950 shadow-[0_0_32px_rgba(52,211,153,0.45)] hover:bg-emerald-300"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add to Wallet"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
