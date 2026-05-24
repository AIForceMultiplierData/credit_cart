"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SearchCardInput } from "@/lib/deal-search"
import { supabase } from "@/lib/supabase"
import { useWalletCards } from "@/hooks/useWalletCards"

function parseSearchCard(item: unknown): SearchCardInput | null {
  if (typeof item !== "object" || item === null) return null
  const row = item as Record<string, unknown>

  const cardId =
    typeof row.card_id === "string"
      ? row.card_id
      : typeof row.id === "string"
        ? row.id
        : null

  const bankName =
    typeof row.bank_name === "string"
      ? row.bank_name
      : typeof row.bank === "string"
        ? row.bank
        : null

  const cardName =
    typeof row.card_name === "string"
      ? row.card_name
      : typeof row.name === "string"
        ? row.name
        : typeof row.network === "string"
          ? row.network
          : null

  if (!cardId || !bankName || !cardName) {
    return null
  }

  return {
    card_id: cardId,
    bank_name: bankName,
    card_name: cardName,
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

function mergeSearchCards(
  walletCards: SearchCardInput[],
  rpcCards: SearchCardInput[]
): SearchCardInput[] {
  const walletIds = new Set(walletCards.map((c) => c.card_id))
  const circleOnly = rpcCards.filter(
    (c) => c.source === "circle" && !walletIds.has(c.card_id)
  )
  return [...walletCards, ...circleOnly]
}

export function useDealSearchCards(userId: string | undefined) {
  const { cards: walletOnly, loading: walletLoading } = useWalletCards(userId)
  const [rpcCards, setRpcCards] = useState<SearchCardInput[]>([])
  const [rpcLoading, setRpcLoading] = useState(false)

  const walletSearchCards = useMemo(
    () => walletCardsToSearchCards(walletOnly, userId, "You"),
    [walletOnly, userId]
  )

  const searchCards = useMemo(
    () => mergeSearchCards(walletSearchCards, rpcCards),
    [walletSearchCards, rpcCards]
  )

  const loadCircleCards = useCallback(async () => {
    if (!userId) {
      setRpcCards([])
      return
    }

    setRpcLoading(true)

    const { data, error } = await supabase.rpc("get_deal_search_cards")

    if (!error && data != null) {
      const raw = Array.isArray(data)
        ? data
        : typeof data === "string"
          ? (JSON.parse(data) as unknown[])
          : []

      const parsed = raw
        .map(parseSearchCard)
        .filter((card): card is SearchCardInput => card !== null)

      const circleOnly = parsed.filter((c) => c.source === "circle")
      setRpcCards(circleOnly)
    } else {
      setRpcCards([])
    }

    setRpcLoading(false)
  }, [userId])

  useEffect(() => {
    void loadCircleCards()
  }, [loadCircleCards])

  const walletCount = searchCards.filter((c) => c.source === "wallet").length
  const circleCount = searchCards.filter((c) => c.source === "circle").length

  return {
    searchCards,
    walletCount,
    circleCount,
    loading: walletLoading || rpcLoading,
    refresh: loadCircleCards,
  }
}
