"use client"

import { useCallback, useEffect, useState } from "react"
import type { SearchCardInput } from "@/lib/deal-search"
import { supabase } from "@/lib/supabase"
import { useWalletCards } from "@/hooks/useWalletCards"

function parseSearchCard(item: unknown): SearchCardInput | null {
  if (typeof item !== "object" || item === null) return null
  const row = item as Record<string, unknown>

  if (
    typeof row.card_id !== "string" ||
    typeof row.bank_name !== "string" ||
    typeof row.card_name !== "string"
  ) {
    return null
  }

  return {
    card_id: row.card_id,
    bank_name: row.bank_name,
    card_name: row.card_name,
    source: row.source === "circle" ? "circle" : "wallet",
    owner_user_id:
      typeof row.owner_user_id === "string" ? row.owner_user_id : undefined,
    owner_name:
      typeof row.owner_name === "string" ? row.owner_name : undefined,
  }
}

function walletCardsToSearchCards(
  cards: Array<{
    card_id: string
    bank_name: string
    card_name: string
  }>,
  ownerUserId?: string,
  ownerName = "You"
): SearchCardInput[] {
  return cards.map((card) => ({
    ...card,
    source: "wallet" as const,
    owner_user_id: ownerUserId,
    owner_name: ownerName,
  }))
}

export function useDealSearchCards(userId: string | undefined) {
  const { cards: walletOnly, loading: walletLoading } = useWalletCards(userId)
  const [searchCards, setSearchCards] = useState<SearchCardInput[]>([])
  const [loading, setLoading] = useState(Boolean(userId))

  const refresh = useCallback(async () => {
    if (!userId) {
      setSearchCards([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase.rpc("get_deal_search_cards")

    if (!error && Array.isArray(data)) {
      const parsed = data
        .map(parseSearchCard)
        .filter((card): card is SearchCardInput => card !== null)

      if (parsed.length > 0) {
        setSearchCards(parsed)
        setLoading(false)
        return
      }
    }

    setSearchCards(walletCardsToSearchCards(walletOnly, userId, "You"))
    setLoading(false)
  }, [userId, walletOnly])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const walletCount = searchCards.filter((c) => c.source === "wallet").length
  const circleCount = searchCards.filter((c) => c.source === "circle").length

  return {
    searchCards,
    walletCount,
    circleCount,
    loading: loading || walletLoading,
    refresh,
  }
}
