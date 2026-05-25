import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function getUserIdFromBearer(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null

  const token = header.slice(7).trim()
  if (!token) return null

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}
