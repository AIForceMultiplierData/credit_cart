"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BankLogo } from "@/components/bank-logo"
import { CardCatalogThumbnail } from "@/components/card-catalog-thumbnail"
import { resolveBankProfile } from "@/lib/bank-registry"
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
  bank_id: string | null
  bank_name: string
  bank_logo_url: string | null
  card_name: string
  style_classes: string
  network: string | null
  card_tier: string | null
  apply_url: string | null
  is_active: boolean
}

export type WalletCardRecord = {
  card_id: string
  bank_id?: string | null
  bank_name: string
  bank_logo_url?: string | null
  card_name: string
  style_classes: string
  active_for_lending: boolean
}

type BankOption = {
  bank_name: string
  bank_id: string
  bank_logo_url: string
  style_classes: string
}

type CardCatalogSelect = Partial<CardCatalogRow> & {
  card_id: string
  bank_name: string
  card_name: string
  style_classes: string
  is_active: boolean
}

function enrichCatalogRow(row: CardCatalogSelect): CardCatalogRow {
  const bank = resolveBankProfile(row.bank_name, row.bank_id)

  return {
    card_id: row.card_id,
    bank_id: row.bank_id ?? bank.bank_id,
    bank_name: row.bank_name,
    bank_logo_url: row.bank_logo_url ?? bank.logo_url,
    card_name: row.card_name,
    style_classes: row.style_classes,
    network: row.network ?? null,
    card_tier: row.card_tier ?? null,
    apply_url: row.apply_url ?? null,
    is_active: row.is_active,
  }
}

function parseCatalogRows(raw: unknown): CardCatalogRow[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((row): row is CardCatalogSelect => {
      if (typeof row !== "object" || row === null) return false
      const item = row as Record<string, unknown>
      return (
        typeof item.card_id === "string" &&
        typeof item.bank_name === "string" &&
        typeof item.card_name === "string" &&
        typeof item.style_classes === "string" &&
        typeof item.is_active === "boolean"
      )
    })
    .map(enrichCatalogRow)
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
      <CardCatalogThumbnail
        bankName={card.bank_name}
        bankId={card.bank_id}
        bankLogoUrl={card.bank_logo_url}
        cardName={card.card_name}
        styleClasses={card.style_classes}
        className="w-full p-4 shadow-lg"
        subtitle={
          <span className="font-mono tracking-widest opacity-60">
            •••• •••• •••• 4242
          </span>
        }
      />
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

      const masterSelect =
        "card_id, bank_id, bank_name, bank_logo_url, card_name, style_classes, network, card_tier, apply_url, is_active"

      try {
        let data: CardCatalogSelect[] | null = null
        let error: { message: string } | null = null

        const masterResult = await supabase
          .from("card_catalog_master")
          .select(masterSelect)
          .returns<CardCatalogSelect[]>()

        if (masterResult.error) {
          const fallback = await supabase
            .from("card_catalog")
            .select(masterSelect)
            .eq("is_active", true)
            .returns<CardCatalogSelect[]>()

          data = fallback.data
          error = fallback.error
        } else {
          data = masterResult.data
        }

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

  const banks = useMemo(() => {
    const map = new Map<string, BankOption>()

    for (const row of catalogData) {
      if (map.has(row.bank_name)) continue
      const profile = resolveBankProfile(row.bank_name, row.bank_id)
      map.set(row.bank_name, {
        bank_name: row.bank_name,
        bank_id: profile.bank_id,
        bank_logo_url: row.bank_logo_url ?? profile.logo_url,
        style_classes: profile.style_classes,
      })
    }

    return [...map.values()].sort((a, b) => a.bank_name.localeCompare(b.bank_name))
  }, [catalogData])

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
        bank_id: selectedCard.bank_id,
        bank_name: selectedCard.bank_name,
        bank_logo_url: selectedCard.bank_logo_url,
        card_name: selectedCard.card_name,
        style_classes: selectedCard.style_classes,
        active_for_lending: false,
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
              {selectedBank ? "Choose your card" : "Select your bank"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedCard
                ? "Confirm and add this card to your trusted circle wallet."
                : selectedBank
                  ? "Scroll and tap the card that matches your wallet."
                  : "Pick a bank logo to browse the live card catalog."}
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
                Run card_catalog_master.sql in Supabase, then wait for the 6 AM
                catalog sync.
              </p>
            </div>
          ) : !selectedBank ? (
            <div className="grid grid-cols-2 gap-3">
              {banks.map((bank) => (
                <button
                  key={bank.bank_name}
                  type="button"
                  onClick={() => setSelectedBank(bank.bank_name)}
                  className={cn(
                    "flex h-20 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 p-3 shadow-md transition-transform active:scale-[0.98]",
                    bank.style_classes
                  )}
                >
                  <BankLogo
                    bankName={bank.bank_name}
                    bankId={bank.bank_id}
                    logoUrl={bank.bank_logo_url}
                    className="h-6 max-w-[5rem]"
                    imageClassName="h-6 w-auto max-w-[5rem]"
                  />
                </button>
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
