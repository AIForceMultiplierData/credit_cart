"use client"

import { LogOut, Pencil } from "lucide-react"
import { toast } from "sonner"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signInWithGoogle } from "@/lib/sign-in"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type ProfileMenuProps = {
  user: SupabaseUser | null
  displayName?: string
  loading?: boolean
  onEditProfile: () => void
  onRequestSignIn?: () => void
}

function getInitial(user: SupabaseUser | null, displayName?: string): string {
  if (displayName?.trim()) return displayName.trim()[0]?.toUpperCase() ?? "?"
  if (user?.user_metadata?.full_name) {
    return String(user.user_metadata.full_name)[0]?.toUpperCase() ?? "?"
  }
  if (user?.email) return user.email[0]?.toUpperCase() ?? "?"
  return "?"
}

export function ProfileMenu({
  user,
  displayName,
  loading,
  onEditProfile,
  onRequestSignIn,
}: ProfileMenuProps) {
  const initial = getInitial(user, displayName)
  const label =
    displayName?.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest"

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Sign out failed", { description: error.message })
      return
    }
    toast.message("Signed out", {
      description: "See you soon on PoolPay.",
    })
  }

  function handleSignIn() {
    if (onRequestSignIn) {
      onRequestSignIn()
      return
    }
    void signInWithGoogle().then(({ error }) => {
      if (error) toast.error("Sign in failed", { description: error })
    })
  }

  if (!user) {
    return (
      <div className="relative flex flex-col items-center">
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSignIn()}
          className="relative flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none"
          aria-label="Sign in to start saving"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping"
          />
          <span
            aria-hidden
            className={cn(
              "absolute -inset-0.5 rounded-full border-2 border-emerald-400/80",
              "animate-[neon-ring_2s_ease-in-out_infinite]"
            )}
          />
          <span
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-full",
              "border border-emerald-400/60 bg-slate-900 text-xs font-bold text-emerald-300",
              "shadow-[0_0_12px_rgba(52,211,153,0.55)]"
            )}
          >
            ?
          </span>
        </button>
        <p className="pointer-events-none absolute top-full mt-2 w-max max-w-[140px] text-center text-[10px] font-medium leading-tight text-emerald-300">
          Tap Here To start saving
        </p>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-gradient-to-br from-purple-500 to-pink-500",
            "text-xs font-bold text-white ring-2 ring-transparent",
            "transition-all hover:ring-emerald-400/50 focus-visible:outline-none focus-visible:ring-emerald-400"
          )}
          aria-label="Open profile menu"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-slate-800 bg-slate-900 text-slate-50"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold text-slate-50">{label}</p>
          {user.email ? (
            <p className="truncate text-xs font-normal text-slate-500">
              {user.email}
            </p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          className="cursor-pointer focus:bg-slate-800 focus:text-slate-50"
          onClick={onEditProfile}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer focus:bg-slate-800 focus:text-slate-50"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
