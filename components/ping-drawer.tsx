"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Radio,
  Send,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import type { Deal } from "@/components/deals-feed"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export type DealPingData = {
  product_name: string
  base_price: number
  card_discount_amount: number
}

type PingDrawerProps = {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PingUiState = "idle" | "processing" | "sent" | "error"

type ContractInsertRow = {
  buyer_id: string
  product_name: string
  base_price: number
  card_discount_amount: number
  escrow_status: "pending_acceptance"
}

function mapDealToPingData(deal: Deal): DealPingData {
  return {
    product_name: deal.title,
    base_price: deal.originalPrice,
    card_discount_amount: deal.cardDiscount,
  }
}

export function PingDrawer({ deal, open, onOpenChange }: PingDrawerProps) {
  const { user, loading: authLoading } = useAuth()
  const [pingState, setPingState] = useState<PingUiState>("idle")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPingState("idle")
      setStatusMessage(null)
    }
  }, [open])

  async function handlePingCircle(dealData: DealPingData) {
    if (authLoading) {
      return
    }

    if (!user) {
      toast.error("Sign in required", {
        description: "Log in to ping your trusted circle.",
      })
      setPingState("error")
      setStatusMessage("Sign in to ping your circle.")
      return
    }

    setPingState("processing")
    setStatusMessage(null)

    const payload: ContractInsertRow = {
      buyer_id: user.id,
      product_name: dealData.product_name.trim(),
      base_price: dealData.base_price,
      card_discount_amount: dealData.card_discount_amount,
      escrow_status: "pending_acceptance",
    }

    try {
      const { error } = await supabase.from("contracts").insert(payload)

      if (error) {
        throw error
      }

      setPingState("sent")
      setStatusMessage("Ping Sent! Waiting for Lender...")
      toast.success("Ping sent", {
        description: "Your circle has been notified to lend their card.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to ping your circle."

      setPingState("error")
      setStatusMessage(message)
      toast.error("Ping failed", { description: message })
    }
  }

  if (!deal) {
    return null
  }

  const basePrice = deal.originalPrice
  const cardDiscount = deal.cardDiscount
  const finalEscrow = deal.discountedPrice
  const isProcessing = pingState === "processing"
  const isSent = pingState === "sent"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] overflow-y-auto rounded-t-3xl border-slate-800 bg-slate-950/95 px-0 pb-8 text-slate-50 backdrop-blur-xl"
      >
        <SheetHeader className="border-b border-slate-800/80 px-6 pb-4 pt-2 text-left">
          <SheetTitle className="text-xl font-bold text-slate-50">
            {deal.title}
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Receipt breakdown and circle ping
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-5">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                {deal.cardName} Card Exclusive
              </span>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="mb-4 border-b border-dashed border-slate-700 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Escrow Receipt
              </p>
            </div>

            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Base Price</span>
                <span className="text-slate-50">₹{basePrice.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-400">Card Discount</span>
                </div>
                <span className="font-medium text-emerald-400">
                  -₹{cardDiscount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-600 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-400" />
                    <span className="font-semibold text-slate-50">Final Escrow</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-50">
                    ₹{finalEscrow.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 text-xs font-bold",
                    index === 0 && "bg-gradient-to-br from-purple-500 to-pink-500",
                    index === 1 && "bg-gradient-to-br from-blue-500 to-cyan-500",
                    index === 2 && "bg-gradient-to-br from-emerald-500 to-teal-500"
                  )}
                >
                  {["R", "P", "A"][index]}
                </div>
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-700">
                <Plus className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <span>3 members will be notified</span>
          </div>

          {statusMessage ? (
            <div
              className={cn(
                "mb-4 rounded-xl border px-4 py-3 text-center text-sm font-medium",
                isSent
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : pingState === "error"
                    ? "border-red-500/30 bg-red-950/30 text-red-300"
                    : "border-slate-700 bg-slate-900/50 text-slate-300"
              )}
            >
              {isSent ? (
                <div className="flex items-center justify-center gap-2">
                  <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                  <span>{statusMessage}</span>
                </div>
              ) : (
                statusMessage
              )}
            </div>
          ) : null}

          <motion.button
            type="button"
            disabled={isProcessing || isSent || authLoading}
            whileTap={{ scale: isProcessing || isSent ? 1 : 0.96 }}
            animate={
              isProcessing
                ? {
                    scale: [1, 0.97, 1.03, 1],
                    boxShadow: [
                      "0 0 24px rgba(52,211,153,0.35)",
                      "0 0 48px rgba(52,211,153,0.85)",
                      "0 0 24px rgba(52,211,153,0.35)",
                    ],
                  }
                : isSent
                  ? {
                      boxShadow: "0 0 28px rgba(52,211,153,0.45)",
                    }
                  : {
                      boxShadow: "0 0 30px rgba(52,211,153,0.4)",
                    }
            }
            transition={
              isProcessing
                ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.25 }
            }
            onClick={() => void handlePingCircle(mapDealToPingData(deal))}
            className={cn(
              "flex h-16 w-full items-center justify-center rounded-2xl border-0",
              "bg-emerald-400 text-lg font-bold text-slate-900",
              "transition-colors hover:bg-emerald-300",
              "disabled:cursor-not-allowed disabled:opacity-70"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Pinging Circle…
              </>
            ) : isSent ? (
              <>
                <Radio className="mr-2 h-5 w-5" />
                Ping Sent
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Ping Circle
              </>
            )}
          </motion.button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Protected by PoolPay Escrow. Funds release only on delivery confirmation.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
