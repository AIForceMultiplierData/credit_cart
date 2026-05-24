"use client"

import { useCallback, useEffect, useState } from "react"
import { FileText, Loader2, ShieldCheck, Clock, CheckCircle2, Package, ShieldAlert } from "lucide-react"
import { DisputeButton } from "@/components/DisputeButton"
import {
  FulfillmentTrigger,
  detectMarketplace,
} from "@/components/FulfillmentTrigger"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type EscrowStatus =
  | "pending_acceptance"
  | "escrow_locked"
  | "order_placed"
  | "completed"
  | "disputed"
  | "cancelled"

type ContractRow = {
  id: string
  buyer_id: string
  lender_id: string | null
  product_name: string
  base_price: number
  card_discount_amount: number
  escrow_status: EscrowStatus
  created_at: string
}

type ActivityContract = ContractRow & {
  role: "buyer" | "lender"
  amount: number
}

const statusConfig: Record<
  EscrowStatus,
  {
    label: string
    color: string
    textColor: string
    bgColor: string
    icon: typeof ShieldCheck
  }
> = {
  pending_acceptance: {
    label: "Pending Acceptance",
    color: "bg-yellow-400",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    icon: Clock,
  },
  escrow_locked: {
    label: "Escrow Locked",
    color: "bg-blue-400",
    textColor: "text-blue-400",
    bgColor: "bg-blue-400/10",
    icon: ShieldCheck,
  },
  order_placed: {
    label: "Order Placed",
    color: "bg-purple-400",
    textColor: "text-purple-400",
    bgColor: "bg-purple-400/10",
    icon: Package,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-400",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    icon: CheckCircle2,
  },
  disputed: {
    label: "Disputed",
    color: "bg-red-400",
    textColor: "text-red-400",
    bgColor: "bg-red-400/10",
    icon: ShieldAlert,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-400",
    textColor: "text-red-400",
    bgColor: "bg-red-400/10",
    icon: Clock,
  },
}

const roleConfig = {
  buyer: {
    label: "You are Buyer",
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-300",
    borderColor: "border-purple-500/30",
  },
  lender: {
    label: "You are Lender",
    bgColor: "bg-cyan-500/20",
    textColor: "text-cyan-300",
    borderColor: "border-cyan-500/30",
  },
}

function formatContractDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(value))
}

function mapContract(row: ContractRow, userId: string): ActivityContract {
  const basePrice = Number(row.base_price)
  const discount = Number(row.card_discount_amount)

  return {
    ...row,
    role: row.buyer_id === userId ? "buyer" : "lender",
    amount: Math.max(basePrice - discount, 0),
  }
}

export function ActivityView() {
  const { user, loading: authLoading } = useAuth()
  const [contracts, setContracts] = useState<ActivityContract[]>([])
  const [loading, setLoading] = useState(true)
  const [loadHint, setLoadHint] = useState<string | null>(null)
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false)

  const fetchContracts = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        setContracts([])
        setLoadHint(null)
        setLiveUpdatesEnabled(false)
        setLoading(false)
        return
      }

      if (!options?.silent) {
        setLoading(true)
      }

      try {
        const { data, error } = await supabase
          .from("contracts")
          .select(
            "id, buyer_id, lender_id, product_name, base_price, card_discount_amount, escrow_status, created_at"
          )
          .or(`buyer_id.eq.${user.id},lender_id.eq.${user.id}`)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setContracts(
          ((data ?? []) as ContractRow[]).map((row) => mapContract(row, user.id))
        )
        setLoadHint(null)
        setLiveUpdatesEnabled(true)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load contracts."
        if (/does not exist|relation|permission denied|PGRST/i.test(message)) {
          setLoadHint(
            "Activity needs Supabase setup. Run supabase/contracts.sql in the SQL Editor."
          )
        } else if (!options?.silent) {
          setLoadHint(message)
        }
        setContracts([])
        setLiveUpdatesEnabled(false)
      } finally {
        if (!options?.silent) {
          setLoading(false)
        }
      }
    },
    [user]
  )

  useEffect(() => {
    if (authLoading) return
    void fetchContracts()
  }, [authLoading, fetchContracts])

  useEffect(() => {
    if (!user || !liveUpdatesEnabled) return

    const channel = supabase
      .channel(`activity-contracts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => {
          void fetchContracts({ silent: true })
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fulfillment_logs" },
        () => {
          void fetchContracts({ silent: true })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, liveUpdatesEnabled, fetchContracts])

  function handleContractStatusChange(contractId: string, nextStatus: string) {
    setContracts((current) =>
      current.map((contract) =>
        contract.id === contractId
          ? { ...contract, escrow_status: nextStatus as EscrowStatus }
          : contract
      )
    )
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center px-4 pb-32 pt-2">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="px-4 pb-32 pt-8 text-center">
        <p className="font-medium text-slate-300">Your activity feed</p>
        <p className="mt-2 text-sm text-slate-500">
          Tap the glowing ? above to sign in and track contracts here.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-32 pt-2">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <span className="text-sm font-semibold uppercase tracking-wider text-purple-400">
            Escrow Ledger
          </span>
        </div>
        <h1 className="text-2xl font-bold text-balance text-slate-50">
          Active Contracts
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Live updates when lenders accept or orders are placed
        </p>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center backdrop-blur-md">
          <p className="font-medium text-slate-300">No contracts yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Ping a deal or accept a lending opportunity to get started.
          </p>
          {loadHint ? (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-left text-xs leading-relaxed text-amber-200/90">
              {loadHint}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const status = statusConfig[contract.escrow_status]
            const role = roleConfig[contract.role]
            const StatusIcon = status.icon
            const isDisputed = contract.escrow_status === "disputed"
            const showFulfillment =
              contract.role === "lender"
                ? contract.escrow_status === "escrow_locked" ||
                  contract.escrow_status === "order_placed"
                : contract.escrow_status === "order_placed"

            return (
              <div
                key={contract.id}
                className={cn(
                  "rounded-2xl border bg-slate-900/60 p-4 backdrop-blur-md",
                  "transition-all duration-300",
                  isDisputed
                    ? "border-red-500/40 shadow-lg shadow-red-500/10"
                    : "border-slate-800/50 hover:border-slate-700/50"
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-50">
                      {contract.product_name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {contract.role === "buyer" ? "Your purchase ping" : "Lending assignment"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-50">
                      ₹{contract.amount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatContractDate(contract.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium",
                      role.bgColor,
                      role.textColor,
                      role.borderColor
                    )}
                  >
                    {role.label}
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                      status.bgColor,
                      status.textColor
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 animate-pulse rounded-full",
                        status.color
                      )}
                    />
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </div>

                {showFulfillment && (
                  <FulfillmentTrigger
                    contractId={contract.id}
                    buyerId={contract.buyer_id}
                    productName={contract.product_name}
                    escrowStatus={contract.escrow_status}
                    marketplace={detectMarketplace(contract.product_name)}
                    userId={user.id}
                    onStatusChange={(nextStatus) =>
                      handleContractStatusChange(contract.id, nextStatus)
                    }
                  />
                )}

                <DisputeButton
                  contractId={contract.id}
                  reporterId={user.id}
                  escrowStatus={contract.escrow_status}
                  onDisputed={() =>
                    handleContractStatusChange(contract.id, "disputed")
                  }
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
