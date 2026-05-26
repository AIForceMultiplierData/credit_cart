"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, MessageCircle, Phone, Users, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { isValidEmail, POOLPAY_TEST_OTP } from "@/lib/auth-constants"
import {
  getTestOtpHint,
  signInWithGoogle,
  verifyOtpAndSetSession,
} from "@/lib/sign-in"
import { useWebOtpAutofill } from "@/hooks/use-web-otp"
import { cn } from "@/lib/utils"

type LoginModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteMessage?: string | null
}

type LoginMethod = "email" | "phone"
type Step = "identifier" | "otp"

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginModal({
  open,
  onOpenChange,
  inviteMessage,
}: LoginModalProps) {
  const [method, setMethod] = useState<LoginMethod>("email")
  const [step, setStep] = useState<Step>("identifier")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contactsGranted, setContactsGranted] = useState(false)

  const reset = useCallback(() => {
    setStep("identifier")
    setOtp("")
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const handleOtpFromSms = useCallback((code: string) => {
    setOtp(code)
  }, [])

  useWebOtpAutofill(open && step === "otp", handleOtpFromSms)

  async function requestContactsAccess() {
    try {
      const nav = navigator as Navigator & {
        contacts?: {
          select: (
            props: string[],
            opts?: { multiple?: boolean }
          ) => Promise<Array<{ name?: string[]; tel?: string[] }>>
        }
      }
      if (!nav.contacts?.select) {
        toast.message("Contacts", {
          description:
            "On mobile Chrome you can pick contacts to share deals on WhatsApp. Desktop browsers may not support this.",
        })
        setContactsGranted(true)
        return
      }
      await nav.contacts.select(["name", "tel"], { multiple: false })
      setContactsGranted(true)
      toast.success("Contacts ready", {
        description: "You can share PoolPay invites on WhatsApp & SMS.",
      })
    } catch {
      toast.message("Contacts skipped", {
        description: "You can still share your invite link manually.",
      })
    }
  }

  async function handleSendOtp() {
    setError(null)
    if (method === "email" && !isValidEmail(email)) {
      setError("Enter a valid email address.")
      return
    }
    if (method === "phone" && phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit mobile number.")
      return
    }
    setStep("otp")
    toast.message("Code sent", {
      description: `${getTestOtpHint()} — enter it below.`,
    })
  }

  async function handleVerifyOtp() {
    if (otp.trim() !== POOLPAY_TEST_OTP) {
      setError(`Use test code ${POOLPAY_TEST_OTP} for now.`)
      return
    }
    setLoading(true)
    setError(null)
    const { error: verifyError } = await verifyOtpAndSetSession({
      email: method === "email" ? email : undefined,
      phone: method === "phone" ? phone : undefined,
      otp,
    })
    setLoading(false)
    if (verifyError) {
      setError(verifyError)
      return
    }
    toast.success("Welcome to PoolPay")
    onOpenChange(false)
    void requestContactsAccess()
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    const { error: googleError } = await signInWithGoogle()
    if (googleError) {
      setError(googleError)
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/85 p-4 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="login-modal-title"
          className="pr-8 text-xl font-bold text-slate-50"
        >
          Sign in to PoolPay
        </h2>
        {inviteMessage ? (
          <p className="mt-2 text-sm text-emerald-300/90">{inviteMessage}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            Email, mobile, or Google — one tap to unlock wallet, deals &amp; AI
            search.
          </p>
        )}

        {step === "identifier" ? (
          <div className="mt-5 space-y-4">
            <div className="flex gap-2 rounded-xl bg-slate-950/60 p-1">
              {(["email", "phone"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-colors",
                    method === m
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {method === "email" ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">
                  Email address
                </label>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email webauthn"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-700 bg-slate-950 text-slate-50"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">
                  Mobile number (India)
                </label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-slate-700 bg-slate-950 text-slate-50"
                />
              </div>
            )}

            <Button
              type="button"
              className="h-11 w-full bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400"
              onClick={() => void handleSendOtp()}
            >
              Send verification code
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
                <span className="bg-slate-900 px-2 text-slate-500">or</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void handleGoogle()}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-4 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
            >
              <GoogleGIcon className="h-5 w-5 shrink-0" />
              Login using Google account
            </button>
            <p className="text-center text-[10px] text-slate-500">
              Uses your Google account in this browser — no extra password.
            </p>

            <button
              type="button"
              onClick={() => void requestContactsAccess()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-colors",
                contactsGranted
                  ? "border-emerald-500/40 text-emerald-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-600"
              )}
            >
              <Users className="h-4 w-4" />
              Enable contacts for WhatsApp &amp; SMS invites
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-400">
              Enter the 4-digit code we sent
              {method === "email" ? ` to ${email}` : ` to ${phone}`}.
            </p>
            <InputOTP
              maxLength={4}
              value={otp}
              onChange={setOtp}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-12 w-11 border-slate-600 bg-slate-950 text-lg" />
                <InputOTPSlot index={1} className="h-12 w-11 border-slate-600 bg-slate-950 text-lg" />
                <InputOTPSlot index={2} className="h-12 w-11 border-slate-600 bg-slate-950 text-lg" />
                <InputOTPSlot index={3} className="h-12 w-11 border-slate-600 bg-slate-950 text-lg" />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-center text-[10px] text-amber-300/90">
              {getTestOtpHint()} (shared testers)
            </p>
            <Button
              type="button"
              disabled={loading || otp.length < 4}
              className="h-11 w-full bg-emerald-500 font-bold text-slate-950"
              onClick={() => void handleVerifyOtp()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify & continue"
              )}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
              onClick={() => setStep("identifier")}
            >
              Change email / phone
            </button>
          </div>
        )}

        {error ? (
          <p className="mt-3 text-center text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600">
          <MessageCircle className="h-3 w-3" />
          <Phone className="h-3 w-3" />
          <span>SMS auto-fill works on supported mobile browsers</span>
        </div>
      </div>
    </div>
  )
}
