import { NextResponse } from "next/server"
import { getAdminUserFromRequest } from "@/lib/admin-auth"
import { loadAdminAnalytics } from "@/lib/admin-analytics"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const adminUser = await getAdminUserFromRequest(request)
    if (!adminUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const analytics = await loadAdminAnalytics(admin)

    return NextResponse.json({ ok: true, ...analytics })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load admin analytics"

    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
