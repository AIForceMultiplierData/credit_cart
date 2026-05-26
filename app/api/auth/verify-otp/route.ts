import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import {
  isValidEmail,
  normalizeIndianPhone,
  phoneToAuthEmail,
  POOLPAY_TEST_OTP,
} from "@/lib/auth-constants"

export const runtime = "nodejs"

type Body = {
  email?: string
  phone?: string
  otp?: string
}

async function findUserByEmail(admin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const target = email.toLowerCase()
  let page = 1
  for (let i = 0; i < 5; i += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === target)
    if (found) return found
    if (data.users.length < 200) break
    page += 1
  }
  return null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const otp = String(body.otp ?? "").trim()

    if (otp !== POOLPAY_TEST_OTP) {
      return NextResponse.json(
        { error: "Invalid verification code. Use 0000 for testing." },
        { status: 401 }
      )
    }

    const emailRaw = typeof body.email === "string" ? body.email.trim() : ""
    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : ""

    let authEmail: string | null = null
    let phoneE164: string | null = null

    if (emailRaw && isValidEmail(emailRaw)) {
      authEmail = emailRaw.toLowerCase()
    } else if (phoneRaw) {
      phoneE164 = normalizeIndianPhone(phoneRaw)
      if (!phoneE164) {
        return NextResponse.json(
          { error: "Enter a valid 10-digit Indian mobile number." },
          { status: 400 }
        )
      }
      authEmail = phoneToAuthEmail(phoneE164)
    } else {
      return NextResponse.json(
        { error: "Enter your email or mobile number." },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    let user = await findUserByEmail(admin, authEmail)

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: authEmail,
        email_confirm: true,
        phone: phoneE164 ?? undefined,
        phone_confirm: phoneE164 ? true : undefined,
        user_metadata: {
          login_method: phoneE164 ? "phone_otp" : "email_otp",
          phone: phoneE164,
          display_email: emailRaw && isValidEmail(emailRaw) ? authEmail : null,
        },
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      user = data.user
    }

    const { data: sessionData, error: sessionError } =
      await admin.auth.admin.createSession({
        user_id: user.id,
      })

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { error: sessionError?.message ?? "Could not create session." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Verification failed unexpectedly."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
