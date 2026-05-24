"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Coins,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useWalletCards } from "@/hooks/useWalletCards"
import { supabase } from "@/lib/supabase"
import { countLendingActiveCards } from "@/lib/wallet-cards"
import { cn } from "@/lib/utils"

type ContractRow = {
  id: string
  buyer_id: string
  product_name: string
  base_price: number
  card_discount_amount: number
  escrow_status: string
  created_at: string
}

type ProfileTrustRow = {
  id: string
  trust_score: number
}

export type LendingOpportunity = ContractRow & {
  buyer_trust_score: number
  platform_credits: number
  escrow_amount: number
}

type AcceptingState = Record<string, boolean>

function getSupabaseErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message)
  }
  return fallback
}

function isSchemaMissingError(message: string): boolean {
  return /does not exist|could not find|schema cache|PGRST204|PGRST205|42P01|relation.*contracts/i.test(
    message
  )
}

function isPermissionError(message: string): boolean {
  return /permission denied|42501|row-level security|insufficient privilege/i.test(
    message
  )
}

function lenderFeedLoadHint(message: string): string {
  if (isSchemaMissingError(message)) {
    return "Contracts table is missing or incomplete. Run supabase/contracts_schema_repair.sql then supabase/lender_feed_fix.sql in the SQL Editor."
  }
  if (isPermissionError(message)) {
    return "Tables exist but access is blocked. Re-run supabase/lender_feed_fix.sql (full file), then refresh the page."
  }
  return message
}

async function loadContractRows(
  userId: string
): Promise<{ rows: ContractRow[]; error: string | null }> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_lender_opportunities"
  )

  if (!rpcError) {
    return { rows: (rpcData ?? []) as ContractRow[], error: null }
  }

  const rpcMessage = getSupabaseErrorMessage(rpcError, "RPC failed")

  if (!/does not exist|could not find|PGRST202|42883/i.test(rpcMessage)) {
    return { rows: [], error: rpcMessage }
  }

  const { data: viewData, error: viewError } = await supabase
    .from("lender_opportunities")
    .select(
      "id, buyer_id, product_name, base_price, card_discount_amount, escrow_status, created_at"
    )
    .neq("buyer_id", userId)
    .order("created_at", { ascending: false })

  if (!viewError) {
    return { rows: (viewData ?? []) as ContractRow[], error: null }
  }

  const { data: tableData, error: tableError } = await supabase
    .from("contracts")
    .select(
      "id, buyer_id, product_name, base_price, card_discount_amount, escrow_status, created_at"
    )
    .eq("escrow_status", "pending_acceptance")
    .neq("buyer_id", userId)
    .order("created_at", { ascending: false })

  if (!tableError) {
    return { rows: (tableData ?? []) as ContractRow[], error: null }
  }

  const tableMessage = getSupabaseErrorMessage(tableError, "Query failed")
  return { rows: [], error: tableMessage || rpcMessage }
}

async function fetchTrustScores(
  buyerIds: string[]
): Promise<Map<string, number>> {
  if (buyerIds.length === 0) {
    return new Map()
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_trust_scores",
    { p_user_ids: buyerIds }
  )

  if (!rpcError && Array.isArray(rpcData)) {
    return new Map(
      (rpcData as ProfileTrustRow[]).map((profile) => [
        profile.id,
        toNumber(profile.trust_score) || 100,
      ])
    )
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, trust_score")
    .in("id", buyerIds)

  if (profilesError) {
    return new Map(buyerIds.map((id) => [id, 100]))
  }

  return new Map(
    ((profiles ?? []) as ProfileTrustRow[]).map((profile) => [
      profile.id,
      toNumber(profile.trust_score) || 100,
    ])
  )
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculatePlatformCredits(cardDiscount: number): number {
  const credits = Math.round(cardDiscount * 0.15)
  return Math.max(credits, 99)
}

function mapOpportunity(
  contract: ContractRow,
  trustByBuyerId: Map<string, number>
): LendingOpportunity {
  const basePrice = toNumber(contract.base_price)
  const cardDiscount = toNumber(contract.card_discount_amount)
  const escrowAmount = Math.max(basePrice - cardDiscount, 0)

  return {
    ...contract,
    base_price: basePrice,
    card_discount_amount: cardDiscount,
    buyer_trust_score: trustByBuyerId.get(contract.buyer_id) ?? 100,
    platform_credits: calculatePlatformCredits(cardDiscount),
    escrow_amount: escrowAmount,
  }
}

export async function acceptDeal(
  contractId: string,
  lenderId: string
): Promise<void> {
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select(
      "id, buyer_id, base_price, card_discount_amount, escrow_status, lender_id"
    )
    .eq("id", contractId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (!contract) {
    throw new Error("Contract not found.")
  }

  if (contract.buyer_id === lenderId) {
    throw new Error("You cannot accept your own contract.")
  }

  if (contract.escrow_status !== "pending_acceptance") {
    throw new Error("This opportunity is no longer available.")
  }

  if (contract.lender_id) {
    throw new Error("This deal has already been accepted.")
  }

  const escrowAmount = Math.max(
    toNumber(contract.base_price) - toNumber(contract.card_discount_amount),
    1
  )

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      lender_id: lenderId,
      escrow_status: "escrow_locked",
    })
    .eq("id", contractId)
    .eq("escrow_status", "pending_acceptance")
    .is("lender_id", null)
    .neq("buyer_id", lenderId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      contract_id: contractId,
      buyer_id: contract.buyer_id,
      transaction_type: "escrow_deposit",
      status: "success",
      amount: escrowAmount,
    })

  if (transactionError) {
    throw new Error(transactionError.message)
  }
}

export function LenderFeed() {
  const { user, loading: authLoading } = useAuth()
  const { cards: walletCards } = useWalletCards(user?.id)
  const lendingActiveCount = countLendingActiveCards(walletCards)
  const [opportunities, setOpportunities] = useState<LendingOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<AcceptingState>({})
  const [loadHint, setLoadHint] = useState<string | null>(null)

  const fetchOpportunities = useCallback(async () => {
    if (!user) {
      setOpportunities([])
      setLoadHint(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadHint(null)

    try {
      const { rows, error: loadError } = await loadContractRows(user.id)

      if (loadError) {
        setLoadHint(lenderFeedLoadHint(loadError))
        setOpportunities([])
        return
      }

      if (rows.length === 0) {
        setOpportunities([])
        return
      }

      const buyerIds = [...new Set(rows.map((row) => row.buyer_id))]
      const trustByBuyerId = await fetchTrustScores(buyerIds)

      setOpportunities(rows.map((row) => mapOpportunity(row, trustByBuyerId)))
    } catch (err) {
      const message = getSupabaseErrorMessage(
        err,
        "Failed to load lending opportunities."
      )
      setLoadHint(lenderFeedLoadHint(message))
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    void fetchOpportunities()
  }, [authLoading, fetchOpportunities])

  async function handleAcceptDeal(contractId: string) {
    if (!user) {
      toast.error("Sign in required", {
        description: "Log in to accept lending opportunities.",
      })
      return
    }

    if (lendingActiveCount === 0) {
      toast.error("Start Earning required", {
        description:
          "Turn on Start Earning for at least one wallet card before accepting deals.",
      })
      return
    }

    setAccepting((current) => ({ ...current, [contractId]: true }))

    try {
      await acceptDeal(contractId, user.id)
      setOpportunities((current) =>
        current.filter((opportunity) => opportunity.id !== contractId)
      )
      toast.success("Deal accepted", {
        description: "Escrow locked. The buyer has been notified.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept this deal."
      toast.error("Accept failed", { description: message })
    } finally {
      setAccepting((current) => ({ ...current, [contractId]: false }))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mb-6 flex min-h-[160px] items-center justify-center rounded-2xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-md">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mb-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center backdrop-blur-md">
        <p className="font-medium text-slate-300">Sign in to lend</p>
        <p className="mt-1 text-sm text-slate-500">
          View active lending opportunities from your circle.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Lender Desk
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-50">
          Active Lending Opportunities
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Accept a ping, lock escrow, and earn platform credits.
        </p>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 text-center backdrop-blur-md">
          <TrendingUp className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="font-medium text-slate-300">No open opportunities</p>
          <p className="mt-1 text-sm text-slate-500">
            When buyers ping the circle, deals will appear here.
          </p>
          {lendingActiveCount === 0 ? (
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
              Go to Wallet and toggle <strong>Start Earning</strong> (green) on
              a card to become eligible as a lender.
            </p>
          ) : null}
          {loadHint ? (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-left text-xs leading-relaxed text-amber-200/90">
              {loadHint}
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-600">
              Lender Desk is connected — waiting for buyer pings in your circle.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => {
            const isAccepting = accepting[opportunity.id] === true

            return (
              <div
                key={opportunity.id}
                className={cn(
                  "rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-md",
                  "shadow-lg shadow-black/20"
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      High Priority
                    </p>
                    <h3 className="mt-1 text-lg font-bold leading-tight text-slate-50">
                      {opportunity.product_name}
                    </h3>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-300">
                      Base Price
                    </p>
                    <p className="font-mono text-sm font-bold text-emerald-400">
                      ₹{opportunity.base_price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2">
                  <Coins className="h-4 w-4 text-blue-300" />
                  <p className="text-sm text-blue-100">
                    Earn{" "}
                    <span className="font-bold text-blue-300">
                      ₹{opportunity.platform_credits.toLocaleString("en-IN")}
                    </span>{" "}
                    in platform credits
                  </p>
                </div>

                <div className="mb-4 rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-400" />
                      <span className="text-sm font-medium text-slate-200">
                        Verify Buyer Trust Score
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-bold",
                        opportunity.buyer_trust_score >= 80
                          ? "bg-emerald-500/15 text-emerald-300"
                          : opportunity.buyer_trust_score >= 60
                            ? "bg-yellow-500/15 text-yellow-300"
                            : "bg-red-500/15 text-red-300"
                      )}
                    >
                      {opportunity.buyer_trust_score}/100
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Escrow lock amount: ₹
                    {opportunity.escrow_amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <motion.div
                  animate={
                    isAccepting
                      ? {
                          boxShadow: [
                            "0 0 0 0 rgba(59,130,246,0.35)",
                            "0 0 0 8px rgba(59,130,246,0.15)",
                            "0 0 0 0 rgba(59,130,246,0.35)",
                          ],
                        }
                      : {
                          boxShadow: [
                            "0 0 0 0 rgba(59,130,246,0.45)",
                            "0 0 0 4px rgba(59,130,246,0.25)",
                            "0 0 0 0 rgba(59,130,246,0.45)",
                          ],
                        }
                  }
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-xl"
                >
                  <Button
                    type="button"
                    disabled={isAccepting}
                    onClick={() => void handleAcceptDeal(opportunity.id)}
                    className={cn(
                      "h-12 w-full rounded-xl border-2 border-blue-400 bg-blue-500/10",
                      "text-base font-bold text-blue-100 hover:bg-blue-500/20"
                    )}
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Locking Escrow…
                      </>
                    ) : (
                      "Accept Deal"
                    )}
                  </Button>
                </motion.div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
