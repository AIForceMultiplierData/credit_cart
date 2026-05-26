"use client"

import { useEffect } from "react"

/** Read SMS OTP from device when browser supports Web OTP API */
export function useWebOtpAutofill(
  enabled: boolean,
  onCode: (code: string) => void
) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return
    if (!("OTPCredential" in window)) return

    const ac = new AbortController()

    void (async () => {
      try {
        const cred = (await navigator.credentials.get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        } as CredentialRequestOptions)) as { code?: string } | null

        const code = cred?.code?.replace(/\D/g, "").slice(0, 4)
        if (code && code.length === 4) {
          onCode(code)
        }
      } catch {
        /* user dismissed or unsupported */
      }
    })()

    return () => ac.abort()
  }, [enabled, onCode])
}
