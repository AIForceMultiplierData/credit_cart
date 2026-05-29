
"use client"

import { useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react"
import { BankLogo } from "@/components/bank-logo"
import { CardCatalogThumbnail } from "@/components/card-catalog-thumbnail"
import { useCardCatalog } from "@/hooks/useCardCatalog"
import type { CatalogCard } from "@/lib/card-catalog.generated"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export type WalletCardRecord = CatalogCard

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  existingCardIds: string[]
  onAddToWallet: (card: WalletCardRecord) => Promise<void>
}

export function AddCardModal({
  open,
  onOpenChange,
  saving,
  existingCardIds,
  onAddToWallet,
}: Props) {
  const { catalog, loading } = useCardCatalog()
  const [query, setQuery] = useState("")
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)

  const banks = useMemo(() => {
    if (!catalog) return []
    const bankSet = new Set<string>()
    const result: {
      bank_id: string
      bank_name: string
      bank_logo_url?: string
    }[] = []
    for (const card of catalog) {
      if (!bankSet.has(card.bank_id)) {
        bankSet.add(card.bank_id)
        result.push({
          bank_id: card.bank_id,
          bank_name: card.bank_name,
          bank_logo_url: card.bank_logo_url,
        })
      }
    }
    return result.sort((a, b) => a.bank_name.localeCompare(b.bank_name))
  }, [catalog])

  const filteredCards = useMemo(() => {
    if (!catalog) return []
    return catalog
      .filter((card) => {
        if (selectedBankId && card.bank_id !== selectedBankId) {
          return false
        }
        if (query) {
          return (
            card.bank_name.toLowerCase().includes(query.toLowerCase()) ||
            card.card_name.toLowerCase().includes(query.toLowerCase())
          )
        }
        return true
      })
      .sort((a, b) => a.card_name.localeCompare(b.card_name))
  }, [catalog, selectedBankId, query])

  const selectedBankName =
    banks.find((b) => b.bank_id === selectedBankId)?.bank_name ?? "a bank"

  async function handleSelectCard(card: CatalogCard) {
    if (saving || existingCardIds.includes(card.card_id)) return
    await onAddToWallet(card)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 text-slate-50 border-slate-800">
        <DialogHeader>
          {selectedBankId ? (
            <div className="flex items-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedBankId(null)}
                className="mr-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <DialogTitle>Add {selectedBankName} Card</DialogTitle>
            </div>
          ) : (
            <DialogTitle>Add a Card to Your Wallet</DialogTitle>
          )}
        </DialogHeader>

        <div className="relative">
          <Input
            placeholder="Search for a card or bank"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          {query && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setQuery("")}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : selectedBankId ? (
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {filteredCards.map((card) => (
              <CardItem
                key={card.card_id}
                card={card}
                isAdded={existingCardIds.includes(card.card_id)}
                onSelect={() => handleSelectCard(card)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {banks.map((bank) => (
              <BankItem
                key={bank.bank_id}
                bank={bank}
                onClick={() => setSelectedBankId(bank.bank_id)}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function BankItem({
  bank,
  onClick,
}: {
  bank: { bank_id: string; bank_name: string; bank_logo_url?: string }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
    >
      <BankLogo bank={bank} className="h-8 w-8 mr-3" />
      <span className="text-sm font-medium">{bank.bank_name}</span>
    </button>
  )
}

function CardItem({
  card,
  isAdded,
  onSelect,
}: {
  card: CatalogCard
  isAdded: boolean
  onSelect: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="relative rounded-lg overflow-hidden cursor-pointer group"
    >
      <CardCatalogThumbnail card={card} />
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {isAdded ? (
          <div className="flex items-center text-white">
            <Check className="h-5 w-5 mr-1" />
            <span>Added</span>
          </div>
        ) : (
          <div className="flex items-center text-white">
            <Plus className="h-5 w-5 mr-1" />
            <span>Add</span>
          </div>
        )}
      </div>
    </div>
  )
}
