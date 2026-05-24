"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { WalletCardRecord } from "@/components/add-card-modal"

function normalizeCard(item: unknown): WalletCardRecord | null {
  if (typeof item !== "object" || item === null) return null
  const row = item as Record<string, unknown>

  if (
    typeof row.card_id === "string" &&
    typeof row.bank_name === "string" &&
    typeof row.card_name === "string"
  ) {
    return {
      card_id: row.card_id,
      bank_name: row.bank_name,
      card_name: row.card_name,
      style_classes:
        typeof row.style_classes === "string"
          ? row.style_classes
          : "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200",
    }
  }

  return null
}

function parseCards(raw: unknown): WalletCardRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizeCard)
    .filter((card): card is WalletCardRecord => card !== null)
}

export function useWalletCards(userId: string | undefined) {
  const [cards, setCards] = useState<WalletCardRecord[]>([])
  const [loading, setLoading] = useState(Boolean(userId))

  const refresh = useCallback(async () => {
    if (!userId) {
      setCards([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase.rpc("get_or_create_my_wallet")

    if (error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("cards")
        .eq("id", userId)
        .maybeSingle()

      setCards(parseCards(profile?.cards))
    } else {
      setCards(parseCards(data))
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { cards, loading, refresh }
}
