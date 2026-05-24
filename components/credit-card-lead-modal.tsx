"use client"

import { useEffect, useState } from "react"
import { Cpu, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import {
  DEFAULT_LEAD_CARD_STYLE,
  normalizeAadhar,
  normalizePan,
  validateCreditCardLeadInput,
  type CardLeadFormContext,
  type EmploymentType,
  type LeadFieldErrors,
} from "@/lib/credit-card-lead"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type CreditCardLeadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardContext?: CardLeadFormContext | null
}

const EMPTY_FORM = {
  full_name: "",
  aadhar_number: "",
  pan_number: "",
  monthly_in_hand_salary: "",
  employment_type: "" as EmploymentType | "",
  employer_name: "",
  self_employed_description: "",
}

export function CreditCardLeadModal({
  open,
  onOpenChange,
  cardContext,
}: CreditCardLeadModalProps) {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [aadharDocument, setAadharDocument] = useState<File | null>(null)
  const [panDocument, setPanDocument] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const cardStyle = cardContext?.style_classes ?? DEFAULT_LEAD_CARD_STYLE
  const cardTitle =
    cardContext?.bank_name && cardContext?.card_name
      ? `${cardContext.bank_name} ${cardContext.card_name}`
      : "Credit Card Application"
  const cardSubtitle = cardContext?.card_id
    ? "Complete your details — we’ll help you apply."
    : "General application — works for any card."

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        full_name: String(user?.user_metadata?.full_name ?? "").trim(),
      })
      setAadharDocument(null)
      setPanDocument(null)
      setFieldErrors({})
    }
  }, [open, user?.user_metadata?.full_name])

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key as keyof LeadFieldErrors]) return prev
      const next = { ...prev }
      delete next[key as keyof LeadFieldErrors]
      return next
    })
  }

  async function handleSubmit() {
    if (!user) {
      toast.error("Sign in required", {
        description: "Sign in with Google to submit your application.",
      })
      return
    }

    const validation = validateCreditCardLeadInput({
      ...form,
      aadhar_document: aadharDocument,
      pan_document: panDocument,
    })

    if (!validation.payload) {
      setFieldErrors(validation.errors)
      toast.error("Fix form errors", {
        description: "Check highlighted fields and try again.",
      })
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("Session expired. Sign in again.")
      }

      const body = new FormData()
      body.set("full_name", validation.payload.full_name)
      body.set("aadhar_number", validation.payload.aadhar_number)
      body.set("pan_number", validation.payload.pan_number)
      body.set(
        "monthly_in_hand_salary",
        String(validation.payload.monthly_in_hand_salary)
      )
      body.set("employment_type", validation.payload.employment_type)

      if (validation.payload.employer_name) {
        body.set("employer_name", validation.payload.employer_name)
      }
      if (validation.payload.self_employed_description) {
        body.set(
          "self_employed_description",
          validation.payload.self_employed_description
        )
      }
      if (cardContext?.card_id) body.set("card_id", cardContext.card_id)
      if (cardContext?.bank_name) body.set("bank_name", cardContext.bank_name)
      if (cardContext?.card_name) body.set("card_name", cardContext.card_name)
      body.set("source", cardContext?.source ?? "apply_cta")
      if (aadharDocument) body.set("aadhar_document", aadharDocument)
      if (panDocument) body.set("pan_document", panDocument)

      const response = await fetch("/api/leads/credit-card", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body,
      })

      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
        message?: string
        field_errors?: LeadFieldErrors
      }

      if (!response.ok) {
        if (payload.field_errors) {
          setFieldErrors(payload.field_errors)
        }
        throw new Error(payload.error ?? "Submission failed.")
      }

      toast.success("Application submitted", {
        description:
          payload.message ??
          "Our team will contact you about your credit card application.",
      })
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not submit application."
      toast.error("Submission failed", { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden border-slate-800 bg-slate-950 p-0 text-slate-50 sm:max-w-md">
        <div
          className={cn(
            "relative overflow-hidden px-5 pb-5 pt-4",
            "border-b border-white/10",
            cardStyle
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />
          <DialogHeader className="relative space-y-2 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-11 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
                <Cpu className="h-4 w-4 opacity-90" aria-hidden />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
                {cardContext?.bank_name ?? "PoolPay"}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-inherit">
              {cardTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-inherit/80">
              {cardSubtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(92vh-11rem)] space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="lead-full-name">Full name</Label>
            <Input
              id="lead-full-name"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              placeholder="As on PAN / Aadhaar"
              className="border-slate-700 bg-slate-900"
            />
            {fieldErrors.full_name ? (
              <p className="text-xs text-red-400">{fieldErrors.full_name}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-aadhar">Aadhaar number</Label>
              <Input
                id="lead-aadhar"
                inputMode="numeric"
                value={form.aadhar_number}
                onChange={(e) =>
                  updateField("aadhar_number", normalizeAadhar(e.target.value))
                }
                placeholder="12 digits"
                maxLength={12}
                className="border-slate-700 bg-slate-900"
              />
              {fieldErrors.aadhar_number ? (
                <p className="text-xs text-red-400">{fieldErrors.aadhar_number}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-pan">PAN</Label>
              <Input
                id="lead-pan"
                value={form.pan_number}
                onChange={(e) =>
                  updateField("pan_number", normalizePan(e.target.value))
                }
                placeholder="ABCDE1234F"
                maxLength={10}
                className="border-slate-700 bg-slate-900 uppercase"
              />
              {fieldErrors.pan_number ? (
                <p className="text-xs text-red-400">{fieldErrors.pan_number}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-aadhar-doc">Aadhaar upload (optional)</Label>
              <label
                htmlFor="lead-aadhar-doc"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 hover:border-emerald-500/40"
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {aadharDocument?.name ?? "PDF or image, max 2MB"}
                </span>
              </label>
              <input
                id="lead-aadhar-doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setAadharDocument(file)
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.aadhar_document
                    return next
                  })
                }}
              />
              {fieldErrors.aadhar_document ? (
                <p className="text-xs text-red-400">
                  {fieldErrors.aadhar_document}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-pan-doc">PAN upload (optional)</Label>
              <label
                htmlFor="lead-pan-doc"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 hover:border-emerald-500/40"
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {panDocument?.name ?? "PDF or image, max 2MB"}
                </span>
              </label>
              <input
                id="lead-pan-doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setPanDocument(file)
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.pan_document
                    return next
                  })
                }}
              />
              {fieldErrors.pan_document ? (
                <p className="text-xs text-red-400">{fieldErrors.pan_document}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-salary">Monthly in-hand salary (₹)</Label>
            <Input
              id="lead-salary"
              inputMode="decimal"
              value={form.monthly_in_hand_salary}
              onChange={(e) =>
                updateField("monthly_in_hand_salary", e.target.value)
              }
              placeholder="e.g. 85000"
              className="border-slate-700 bg-slate-900"
            />
            {fieldErrors.monthly_in_hand_salary ? (
              <p className="text-xs text-red-400">
                {fieldErrors.monthly_in_hand_salary}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Employment</Label>
            <Select
              value={form.employment_type || undefined}
              onValueChange={(value) =>
                updateField("employment_type", value as EmploymentType)
              }
            >
              <SelectTrigger className="border-slate-700 bg-slate-900">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900">
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self_employed">Self employed</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.employment_type ? (
              <p className="text-xs text-red-400">{fieldErrors.employment_type}</p>
            ) : null}
          </div>

          {form.employment_type === "employed" ? (
            <div className="space-y-2">
              <Label htmlFor="lead-employer">Organization / employer</Label>
              <Input
                id="lead-employer"
                value={form.employer_name}
                onChange={(e) => updateField("employer_name", e.target.value)}
                placeholder="Company name"
                className="border-slate-700 bg-slate-900"
              />
              {fieldErrors.employer_name ? (
                <p className="text-xs text-red-400">{fieldErrors.employer_name}</p>
              ) : null}
            </div>
          ) : null}

          {form.employment_type === "self_employed" ? (
            <div className="space-y-2">
              <Label htmlFor="lead-self-desc">What do you do?</Label>
              <Textarea
                id="lead-self-desc"
                value={form.self_employed_description}
                onChange={(e) =>
                  updateField("self_employed_description", e.target.value)
                }
                placeholder="e.g. Freelance designer, shop owner, consultant…"
                className="min-h-[80px] border-slate-700 bg-slate-900"
              />
              {fieldErrors.self_employed_description ? (
                <p className="text-xs text-red-400">
                  {fieldErrors.self_employed_description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-800 px-5 py-4">
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="h-12 w-full bg-emerald-400 font-bold text-slate-900 hover:bg-emerald-300"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit application"
            )}
          </Button>
          <p className="mt-2 text-center text-[10px] text-slate-500">
            PDF uploads must be 2MB or less. Your data is stored securely.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
