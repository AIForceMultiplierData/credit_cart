"use client"

import { useCallback, useEffect, useState } from "react"
import type { WalletCardRecord } from "@/components/add-card-modal"
import { parseWalletCards } from "@/lib/wallet-cards"
import { supabase } from "@/lib/supabase"

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

      setCards(parseWalletCards(profile?.cards))
    } else {
      setCards(parseWalletCards(data))
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { cards, loading, refresh }
}
