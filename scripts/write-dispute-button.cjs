const fs = require("fs");

const content = `"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const DISPUTE_PRESETS = [
  "Lender didn't order",
  "Buyer didn't pay",
  "Wrong shipping address provided",
  "Card discount not applied",
  "Other issue",
] as const

export type DisputeButtonProps = {
  contractId: string
  reporterId: string
  escrowStatus: string
  onDisputed?: () => void
}

function isActiveContractStatus(status: string): boolean {
  return (
    status === "pending_acceptance" ||
    status === "escrow_locked" ||
    status === "order_placed"
  )
}

export async function reportDispute(
  contractId: string,
  reporterId: string,
  reason: string
): Promise<void> {
  const trimmedReason = reason.trim()

  if (!trimmedReason) {
    throw new Error("Please describe the dispute reason.")
  }

  const { error: insertError } = await supabase.from("disputes").insert({
    contract_id: contractId,
    reporter_id: reporterId,
    reason: trimmedReason,
    status: "open",
  })

  if (insertError) {
    throw new Error(insertError.message)
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      escrow_status: "disputed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .in("escrow_status", [
      "pending_acceptance",
      "escrow_locked",
      "order_placed",
    ])

  if (updateError) {
    throw new Error(updateError.message)
  }
}

export function DisputeButton({
  contractId,
  reporterId,
  escrowStatus,
  onDisputed,
}: DisputeButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!isActiveContractStatus(escrowStatus)) {
    return null
  }

  async function handleSubmit() {
    setSubmitting(true)

    try {
      await reportDispute(contractId, reporterId, reason)
      toast.error("Dispute reported", {
        description: "Our team and your counterparty have been notified.",
      })
      setOpen(false)
      setReason("")
      onDisputed?.()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to report dispute."
      toast.error("Could not file dispute", { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        className={cn(
          "mt-3 h-10 w-full rounded-xl border border-red-500/20",
          "bg-red-950/20 text-red-300 hover:bg-red-950/40 hover:text-red-200"
        )}
      >
        <ShieldAlert className="mr-2 h-4 w-4" />
        Report Dispute
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-slate-800 bg-slate-950 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Report a Dispute
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Use this panic button if the hand-off failed. This flags the
              contract and opens a resolution case.
            </DialogDescription>
          </DialogHeader>

          <TAG_DIV className="space-y-3">
            <TAG_DIV className="flex flex-wrap gap-2">
              {DISPUTE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    reason === preset
                      ? "border-red-400/50 bg-red-500/15 text-red-200"
                      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600"
                  )}
                >
                  {preset}
                </button>
              ))}
            </TAG_DIV>

            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder='e.g. "Lender didn't order" or "Buyer didn't pay"'
              className="min-h-[120px] border-slate-700 bg-slate-900 text-slate-100"
            />
          </TAG_DIV>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting || reason.trim().length === 0}
              onClick={() => void handleSubmit()}
              className="bg-red-500 font-bold text-white hover:bg-red-400"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Filing…
                </>
              ) : (
                "Submit Dispute"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
`;

fs.writeFileSync(
  "C:/Users/hkathuria/Downloads/poolpay/components/DisputeButton.tsx",
  content.replace(/TAG_DIV/g, "div")
);
