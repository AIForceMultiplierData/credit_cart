"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getWelcomeName(user: User): string {
  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "there"

  return String(displayName).split(" ")[0]
}

function isOAuthReturn(): boolean {
  if (typeof window === "undefined") return false

  const hash = window.location.hash
  const search = window.location.search

  return (
    hash.includes("access_token") ||
    search.includes("code=") ||
    search.includes("error=")
  )
}

function shouldShowWelcomeToast(
  event: AuthChangeEvent,
  hasOAuthCallback: boolean
): boolean {
  if (event === "SIGNED_IN") return true
  if (event === "INITIAL_SESSION" && hasOAuthCallback) return true
  return false
}

function clearOAuthCallbackFromUrl() {
  if (typeof window === "undefined") return

  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, "", cleanUrl)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const welcomeShownRef = useRef(false)
  const oauthReturnRef = useRef(false)

  useEffect(() => {
    oauthReturnRef.current = isOAuthReturn()
  }, [])

  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return

      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)

      if (
        nextSession?.user &&
        !welcomeShownRef.current &&
        shouldShowWelcomeToast(event, oauthReturnRef.current)
      ) {
        welcomeShownRef.current = true
        oauthReturnRef.current = false

        toast.success(`Welcome, ${getWelcomeName(nextSession.user)}!`, {
          description: "You're signed in to PoolPay.",
        })

        clearOAuthCallbackFromUrl()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({ user, session, loading }),
    [user, session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
