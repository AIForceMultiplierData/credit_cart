const fs = require("fs");

const content = `"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Cpu, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type CatalogCard = {
  id: string
  name: string
  style: string
}

export type CatalogBank = keyof typeof CARD_CATALOG

export const CARD_CATALOG = {
  HDFC: [
    {
      id: "hdfc_millennia",
      name: "Millennia",
      style: "bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100",
    },
    {
      id: "hdfc_regalia",
      name: "Regalia Gold",
      style: "bg-gradient-to-br from-yellow-700 to-amber-950 text-yellow-100",
    },
    {
      id: "hdfc_diners",
      name: "Diners Club Black",
      style: "bg-gradient-to-br from-zinc-900 to-black text-slate-300",
    },
  ],
  SBI: [
    {
      id: "sbi_cashback",
      name: "Cashback Card",
      style: "bg-gradient-to-br from-cyan-500 to-blue-700 text-white",
    },
    {
      id: "sbi_simplyclick",
      name: "SimplyCLICK",
      style: "bg-gradient-to-br from-teal-400 to-emerald-700 text-white",
    },
  ],
  ICICI: [
    {
      id: "icici_amazon",
      name: "Amazon Pay",
      style: "bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100",
    },
    {
      id: "icici_sapphiro",
      name: "Sapphiro",
      style: "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200",
    },
  ],
  AXIS: [
    {
      id: "axis_flipkart",
      name: "Flipkart Axis",
      style: "bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white",
    },
    {
      id: "axis_magnus",
      name: "Magnus",
      style: "bg-gradient-to-br from-zinc-800 to-red-950 text-red-100",
    },
  ],
} as const satisfies Record<string, CatalogCard[]>

const BANKS = Object.keys(CARD_CATALOG) as CatalogBank[]

export type WalletCardRecord = {
  id: string
  bank: string
  name: string
  style: string
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
  bank,
  selected,
  onSelect,
}: {
  card: CatalogCard
  bank: string
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
      <TAG_CARD
        className={cn(
          "relative aspect-[1.58/1] w-full overflow-hidden rounded-xl p-4 shadow-lg",
          "flex flex-col justify-between border border-white/10",
          card.style
        )}
      >
        <TAG_DIV className="flex items-start justify-between">
          <TAG_DIV className="flex h-8 w-10 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
            <Cpu className="h-4 w-4 opacity-90" aria-hidden />
          </TAG_DIV>
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
            {bank}
          </span>
        </TAG_DIV>
        <TAG_DIV>
          <p className="text-lg font-bold leading-tight">{card.name}</p>
          <p className="mt-1 font-mono text-[10px] tracking-widest opacity-60">
            •••• •••• •••• 4242
          </p>
        </TAG_DIV>
      </TAG_CARD>
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
  const [selectedBank, setSelectedBank] = useState<CatalogBank | null>(null)
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedBank(null)
      setSelectedCard(null)
    }
  }, [open])

  const catalogCards = selectedBank ? CARD_CATALOG[selectedBank] : []

  async function handleAddToWallet() {
    if (!selectedBank || !selectedCard) return

    if (existingCardIds.includes(selectedCard.id)) {
      return
    }

    await onAddToWallet({
      id: selectedCard.id,
      bank: selectedBank,
      name: selectedCard.name,
      style: selectedCard.style,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-slate-800 bg-slate-950/95 p-0 text-slate-50 backdrop-blur-xl sm:max-w-md">
        <TAG_DIV className="border-b border-slate-800/80 bg-slate-900/60 px-5 py-4 backdrop-blur-md">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-bold text-slate-50">
              {selectedBank ? \`Choose \${selectedBank} Card\` : "Select Your Bank"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedCard
                ? "Confirm and add this card to your trusted circle wallet."
                : selectedBank
                  ? "Scroll and tap the card that matches your wallet."
                  : "Pick a bank to browse the Indian card catalog."}
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
              disabled={saving}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to banks
            </Button>
          )}
          {selectedBank && !selectedCard && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 -ml-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              onClick={() => setSelectedBank(null)}
              disabled={saving}
            >
              Change bank
            </Button>
          )}
        </TAG_DIV>

        <TAG_DIV className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {!selectedBank && (
            <TAG_DIV className="grid grid-cols-2 gap-3">
              {BANKS.map((bank) => (
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
            </TAG_DIV>
          )}

          {selectedBank && (
            <TAG_DIV className="flex flex-col gap-4">
              {catalogCards.map((card) => (
                <CatalogCardPreview
                  key={card.id}
                  card={card}
                  bank={selectedBank}
                  selected={selectedCard?.id === card.id}
                  onSelect={() => setSelectedCard(card)}
                />
              ))}
            </TAG_DIV>
          )}
        </TAG_DIV>

        {selectedCard && selectedBank && (
          <TAG_DIV className="border-t border-slate-800/80 bg-slate-900/80 p-5 backdrop-blur-md">
            {existingCardIds.includes(selectedCard.id) ? (
              <p className="mb-3 text-center text-sm text-amber-400">
                This card is already in your wallet.
              </p>
            ) : null}
            <Button
              type="button"
              disabled={saving || existingCardIds.includes(selectedCard.id)}
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
          </TAG_DIV>
        )}
      </DialogContent>
    </Dialog>
  )
}
`;

const fixed = content
  .replace(/TAG_DIV/g, "motionless-overlay")
  .replace(/TAG_CARD/g, "motionless-overlay")
  .replace(/<motionless-overlay/g, "<div")
  .replace(/<\/motionless-overlay>/g, "</div>");

fs.writeFileSync(
  "C:/Users/hkathuria/Downloads/poolpay/components/add-card-modal.tsx",
  fixed
);
