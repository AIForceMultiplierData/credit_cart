import { POOLPAY_TEST_OTP } from "@/lib/auth-constants"
import { supabase } from "@/lib/supabase"

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: "Unable to start Google sign-in. Please try again." }
  }
}

export async function verifyOtpAndSetSession(input: {
  email?: string
  phone?: string
  otp: string
}): Promise<{ error: string | null }> {
  try {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        otp: input.otp.trim(),
      }),
    })

    const payload = (await response.json()) as {
      access_token?: string
      refresh_token?: string
      error?: string
    }

    if (!response.ok) {
      return { error: payload.error ?? "Verification failed." }
    }

    if (!payload.access_token || !payload.refresh_token) {
      return { error: "Invalid server response." }
    }

    const { error } = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: "Could not verify code. Check your connection." }
  }
}

export function getTestOtpHint(): string {
  return `Test code: ${POOLPAY_TEST_OTP}`
}
