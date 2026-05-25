"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CreditCard,
  Loader2,
  Plus,
  Shield,
  Sparkles,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import {
  AddCardModal,
  type WalletCardRecord,
} from "@/components/add-card-modal"
import {
  WalletCardLendingToggle,
  WalletCardTile,
} from "@/components/wallet-card-lending-toggle"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { enrichWalletCards } from "@/lib/enrich-wallet-card"
import {
  countLendingActiveCards,
  parseWalletCards,
  serializeWalletCards,
} from "@/lib/wallet-cards"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type WalletCard = WalletCardRecord

function getSupabaseErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message: string }).message)
    const code =
      "code" in err && (err as { code?: string }).code
        ? String((err as { code: string }).code)
        : ""

    if (
      code === "PGRST202" ||
      message.includes("get_or_create_my_wallet") ||
      message.includes("upsert_my_wallet")
    ) {
      return "Wallet RPC not installed. Run supabase/wallet_policies.sql in Supabase SQL Editor."
    }

    if (message.includes("row-level security")) {
      return `${message} — run supabase/wallet_policies.sql in Supabase SQL Editor.`
    }

    const hint =
      "hint" in err && (err as { hint?: string }).hint
        ? ` (${(err as { hint: string }).hint})`
        : ""
    return `${message}${hint}`
  }
  return fallback
}

export function WalletView() {
  const { user, loading: authLoading } = useAuth()
  const [cards, setCards] = useState<WalletCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [loadHint, setLoadHint] = useState<string | null>(null)

  const fetchCards = useCallback(async () => {
    if (!user) {
      setCards([])
      setLoadHint(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadHint(null)

    try {
      const { data, error } = await supabase.rpc("get_or_create_my_wallet")

      if (error) throw error

      setCards(enrichWalletCards(parseWalletCards(data ?? [])))
    } catch (err) {
      const message = getSupabaseErrorMessage(
        err,
        "Failed to load wallet cards."
      )
      if (/does not exist|row-level security|PGRST|get_or_create/i.test(message)) {
        setLoadHint(
          "Wallet needs Supabase setup. Run supabase/wallet_policies.sql in the SQL Editor."
        )
      } else {
        setLoadHint(message)
      }
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    void fetchCards()
  }, [authLoading, fetchCards])

  async function updateWallet(
    nextCards: WalletCard[],
    options?: { toastMessage?: string; toastDescription?: string }
  ) {
    if (!user) {
      toast.error("Sign in required", {
        description: "Log in to save cards to your wallet.",
      })
      return
    }

    setSaving(true)

    try {
      const payload = serializeWalletCards(nextCards)
      const { data, error } = await supabase.rpc("upsert_my_wallet", {
        p_cards: payload,
      })

      if (error) throw error

      setCards(enrichWalletCards(parseWalletCards(data ?? payload)))
      toast.success(options?.toastMessage ?? "Wallet updated", {
        description:
          options?.toastDescription ??
          "Your card is now in the circle arsenal.",
      })
    } catch (err) {
      const message = getSupabaseErrorMessage(err, "Failed to update wallet.")
      toast.error("Save failed", { description: message })
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleLendingToggle(cardId: string, active: boolean) {
    const previous = cards
    const nextCards = cards.map((card) =>
      card.card_id === cardId
        ? { ...card, active_for_lending: active }
        : card
    )

    setCards(nextCards)

    try {
      await updateWallet(nextCards, {
        toastMessage: active ? "Start Earning enabled" : "Lending paused",
        toastDescription: active
          ? "This card is now active on the Lender Desk."
          : "This card is hidden from lending opportunities.",
      })
    } catch {
      setCards(previous)
    }
  }

  async function handleAddCatalogCard(card: WalletCard) {
    if (cards.some((existing) => existing.card_id === card.card_id)) {
      toast.error("Already in wallet", {
        description: "This card is already in your arsenal.",
      })
      return
    }

    await updateWallet([...cards, { ...card, active_for_lending: false }])
  }

  const lendingActiveCount = countLendingActiveCards(cards)
  const isBusy = loading || authLoading || saving

  if (authLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center px-4 pb-32 pt-2">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="px-4 pb-32 pt-8 text-center">
        <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-600" />
        <p className="font-medium text-slate-300">Your wallet</p>
        <p className="mt-2 text-sm text-slate-500">
          Tap the glowing ? above to sign in and add cards.
        </p>
        <p className="mt-6 text-2xl font-bold text-slate-50">0</p>
        <p className="text-xs text-slate-500">cards in wallet</p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-32 pt-2">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Trusted Circle
          </span>
        </div>
        <h1 className="text-2xl font-bold text-balance text-slate-50">
          Your Circle&apos;s Arsenal
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Toggle Start Earning to list a card on the Lender Desk
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {cards.length} card{cards.length === 1 ? "" : "s"} in wallet
        </p>
        <Button
          type="button"
          size="sm"
          disabled={isBusy || !user}
          onClick={() => setAddOpen(true)}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Card
        </Button>
      </div>

      {loading || authLoading ? (
        <div className="mb-6 flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-md">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      ) : cards.length === 0 ? (
        <div className="mb-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center backdrop-blur-md">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="font-medium text-slate-300">No cards yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Browse the Indian card catalog and add your first card.
          </p>
          {loadHint ? (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-left text-xs leading-relaxed text-amber-200/90">
              {loadHint}
            </p>
          ) : null}
          <Button
            type="button"
            className="mt-4 rounded-xl bg-emerald-500 text-slate-900 hover:bg-emerald-400"
            disabled={!user || saving}
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <WalletCardTile
              key={card.card_id}
              card={card}
              lendingToggle={
                <WalletCardLendingToggle
                  card={card}
                  disabled={isBusy}
                  onToggle={(cardId, active) => {
                    void handleLendingToggle(cardId, active)
                  }}
                />
              }
            />
          ))}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-800/50 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-50">Circle Power</p>
            <p className="text-sm text-slate-400">
              {lendingActiveCount} lending • {cards.length} cards • synced to
              Supabase
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-800/50 p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{cards.length}</p>
            <p className="text-xs text-slate-500">Cards</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 p-3 text-center">
            <p className="text-xl font-bold text-green-400">
              {lendingActiveCount}
            </p>
            <p className="text-xs text-slate-500">Earning</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 p-3 text-center">
            <p className="text-xl font-bold text-purple-400">0</p>
            <p className="text-xs text-slate-500">Pooled</p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        className={cn(
          "h-14 w-full rounded-xl border-0",
          "bg-gradient-to-r from-emerald-500 to-emerald-400",
          "text-base font-bold text-slate-900 shadow-lg shadow-emerald-500/25",
          "hover:from-emerald-400 hover:to-emerald-300"
        )}
        onClick={() => {
          if (navigator.share) {
            void navigator.share({
              title: "Join my PoolPay circle",
              text: "Pool credit card discounts with me on PoolPay.",
              url: window.location.origin,
            })
          } else {
            toast.message("Invite link", {
              description: window.location.origin,
            })
          }
        }}
      >
        <UserPlus className="mr-2 h-5 w-5" />
        Invite Friends to Circle
      </Button>

      <AddCardModal
        open={addOpen}
        onOpenChange={setAddOpen}
        saving={saving}
        existingCardIds={cards.map((card) => card.card_id)}
        onAddToWallet={handleAddCatalogCard}
      />
    </div>
  )
}
