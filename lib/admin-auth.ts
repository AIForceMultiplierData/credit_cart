import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type { User } from "@supabase/supabase-js"

export const ADMIN_EMAIL = "founder@forcemultiplierdata.com"

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL
}

export async function getAdminUserFromRequest(
  request: Request
): Promise<User | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice("Bearer ".length).trim()
  if (!token) return null

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  if (!isAdminEmail(data.user.email)) return null

  return data.user
}
