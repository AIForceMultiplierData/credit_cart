import { supabase } from "@/lib/supabase"

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
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
