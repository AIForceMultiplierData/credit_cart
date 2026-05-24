const fs = require("fs");

const content = `"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ClipboardCopy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Package,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export type Marketplace = "amazon" | "flipkart"

export type FulfillmentTriggerProps = {
  contractId: string
  buyerId: string
  productName: string
  escrowStatus: string
  marketplace?: Marketplace
  userId: string
  onStatusChange?: (status: string) => void
}

type FulfillmentLogRow = {
  tracking_number: string
  created_at: string
}

const MARKETPLACE_URLS: Record<Marketplace, string> = {
  amazon: "https://www.amazon.in/gp/cart/view.html",
  flipkart: "https://www.flipkart.com/viewcart",
}

export function detectMarketplace(productName: string): Marketplace {
  if (/flipkart/i.test(productName)) {
    return "flipkart"
  }
  return "amazon"
}

export async function confirmOrderPlaced(
  contractId: string,
  lenderId: string,
  trackingNumber: string
): Promise<void> {
  const trimmedTracking = trackingNumber.trim()

  if (!trimmedTracking) {
    throw new Error("Tracking number is required.")
  }

  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select("id, lender_id, escrow_status")
    .eq("id", contractId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (!contract) {
    throw new Error("Contract not found.")
  }

  if (contract.lender_id !== lenderId) {
    throw new Error("Only the assigned lender can confirm fulfillment.")
  }

  if (contract.escrow_status !== "escrow_locked") {
    throw new Error("Contract is not ready for fulfillment.")
  }

  const { error: logError } = await supabase.from("fulfillment_logs").insert({
    contract_id: contractId,
    placed_by: lenderId,
    tracking_number: trimmedTracking,
  })

  if (logError) {
    throw new Error(logError.message)
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      escrow_status: "order_placed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .eq("escrow_status", "escrow_locked")

  if (updateError) {
    throw new Error(updateError.message)
  }
}

export function FulfillmentTrigger({
  contractId,
  buyerId,
  productName,
  escrowStatus,
  marketplace,
  userId,
  onStatusChange,
}: FulfillmentTriggerProps) {
  const [status, setStatus] = useState(escrowStatus)
  const [shippingAddress, setShippingAddress] = useState<string | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressRevealed, setAddressRevealed] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [trackingLog, setTrackingLog] = useState<FulfillmentLogRow | null>(null)

  const retailer = marketplace ?? detectMarketplace(productName)

  const syncStatus = useCallback(
    (nextStatus: string) => {
      setStatus(nextStatus)
      onStatusChange?.(nextStatus)
    },
    [onStatusChange]
  )

  const fetchShippingAddress = useCallback(async () => {
    setAddressLoading(true)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("shipping_address")
        .eq("id", buyerId)
        .maybeSingle()

      if (error) {
        throw error
      }

      const address =
        typeof data?.shipping_address === "string"
          ? data.shipping_address.trim()
          : ""

      setShippingAddress(address || "No shipping address saved for this buyer.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load shipping address."
      toast.error("Could not load address", { description: message })
      setShippingAddress(null)
    } finally {
      setAddressLoading(false)
    }
  }, [buyerId])

  const fetchTrackingLog = useCallback(async () => {
    const { data, error } = await supabase
      .from("fulfillment_logs")
      .select("tracking_number, created_at")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return
    }

    if (data) {
      setTrackingLog(data as FulfillmentLogRow)
    }
  }, [contractId])

  useEffect(() => {
    setStatus(escrowStatus)
  }, [escrowStatus])

  useEffect(() => {
    if (status === "order_placed") {
      void fetchTrackingLog()
    }
  }, [status, fetchTrackingLog])

  useEffect(() => {
    const channel = supabase
      .channel(\`fulfillment-contract-\${contractId}\`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: \`id=eq.\${contractId}\`,
        },
        (payload) => {
          const nextStatus = (payload.new as { escrow_status?: string })
            .escrow_status

          if (nextStatus) {
            syncStatus(nextStatus)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fulfillment_logs",
          filter: \`contract_id=eq.\${contractId}\`,
        },
        (payload) => {
          const row = payload.new as FulfillmentLogRow
          setTrackingLog(row)
          syncStatus("order_placed")
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [contractId, syncStatus])

  async function handleRevealAddress() {
    if (shippingAddress === null && !addressLoading) {
      await fetchShippingAddress()
    }
    setAddressRevealed((current) => !current)
  }

  async function handleCopyAddress() {
    if (!shippingAddress) {
      await fetchShippingAddress()
    }

    const addressToCopy = shippingAddress ?? ""

    if (!addressToCopy || addressToCopy.startsWith("No shipping")) {
      toast.error("No address available to copy")
      return
    }

    try {
      await navigator.clipboard.writeText(addressToCopy)
      toast.success("Address Copied to Clipboard")
    } catch {
      toast.error("Clipboard access denied")
    }
  }

  function handleOpenMarketplace() {
    const url = MARKETPLACE_URLS[retailer]
    window.open(url, "_blank", "noopener,noreferrer")
  }

  async function handleConfirmOrderPlaced() {
    setSubmitting(true)

    try {
      await confirmOrderPlaced(contractId, userId, trackingNumber)
      syncStatus("order_placed")
      toast.success("Order confirmed", {
        description: "Buyer notified — waiting for delivery.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm order."
      toast.error("Confirmation failed", { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "order_placed") {
    return (
      <TAG_DIV className="mt-4 rounded-2xl border border-blue-500/20 bg-slate-900/50 p-4 backdrop-blur-md">
        <TAG_DIV className="mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-400" />
          <h4 className="font-semibold text-slate-50">Waiting for Delivery</h4>
        </TAG_DIV>

        <TAG_DIV className="space-y-3">
          <TAG_DIV className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Tracking Number
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-blue-300">
              {trackingLog?.tracking_number ?? trackingNumber || "Pending sync…"}
            </p>
          </TAG_DIV>

          <TAG_DIV className="flex items-center gap-2 text-sm text-slate-400">
            <Package className="h-4 w-4 text-emerald-400" />
            <span>{productName}</span>
          </TAG_DIV>

          <TAG_DIV className="h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
              initial={{ width: "15%" }}
              animate={{ width: "62%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </TAG_DIV>

          <p className="text-xs text-slate-500">
            Escrow remains locked until delivery is confirmed by the buyer.
          </p>
        </TAG_DIV>
      </TAG_DIV>
    )
  }

  if (status !== "escrow_locked") {
    return null
  }

  return (
    <TAG_DIV className="mt-4 rounded-2xl border border-blue-500/30 bg-slate-900/50 p-4 backdrop-blur-md">
      <TAG_DIV className="mb-3 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-400" />
        <h4 className="font-semibold text-slate-50">Fulfillment Trigger</h4>
      </TAG_DIV>

      <p className="mb-4 text-sm text-slate-400">
        Escrow is locked. Reveal the buyer address, place the order, then confirm
        with a tracking number.
      </p>

      <TAG_DIV className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleRevealAddress()}
          disabled={addressLoading}
          className="w-full justify-center rounded-xl border-slate-700 bg-slate-950/40 text-slate-100 hover:bg-slate-900"
        >
          {addressLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : addressRevealed ? (
            <EyeOff className="mr-2 h-4 w-4" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {addressRevealed ? "Hide Shipping Details" : "Reveal Shipping Details"}
        </Button>

        <AnimatePresence initial={false}>
          {addressRevealed && (
            <motion.div
              key="shipping-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <TAG_DIV className="rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Buyer Shipping Address
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                  {shippingAddress ?? "Loading address…"}
                </p>
              </TAG_DIV>
            </motion.div>
          )}
        </AnimatePresence>

        <TAG_DIV className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => void handleCopyAddress()}
            className="rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
            variant="outline"
          >
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy Address for Order
          </Button>

          <Button
            type="button"
            onClick={handleOpenMarketplace}
            className="rounded-xl border-blue-400/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open {retailer === "flipkart" ? "Flipkart" : "Amazon"}
          </Button>
        </TAG_DIV>

        <TAG_DIV className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-3">
          <label
            htmlFor={\`tracking-\${contractId}\`}
            className="mb-2 block text-xs uppercase tracking-wide text-slate-500"
          >
            Tracking Number
          </label>
          <Input
            id={\`tracking-\${contractId}\`}
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="Enter courier tracking ID"
            className="mb-3 border-slate-700 bg-slate-900 text-slate-100"
          />
          <Button
            type="button"
            disabled={submitting || trackingNumber.trim().length === 0}
            onClick={() => void handleConfirmOrderPlaced()}
            className={cn(
              "h-11 w-full rounded-xl bg-blue-500 font-bold text-white",
              "hover:bg-blue-400"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              "Confirm Order Placed"
            )}
          </Button>
        </TAG_DIV>
      </TAG_DIV>
    </TAG_DIV>
  )
}
`;

fs.writeFileSync(
  "C:/Users/hkathuria/Downloads/poolpay/components/FulfillmentTrigger.tsx",
  content.replace(/TAG_DIV/g, "div")
);
