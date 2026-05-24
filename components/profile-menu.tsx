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
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type ProfileMenuProps = {
  user: SupabaseUser | null
  displayName?: string
  loading?: boolean
  onEditProfile: () => void
  onSignIn: () => void
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
  onSignIn,
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

  if (!user) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={onSignIn}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          "border border-slate-700 bg-slate-900 text-slate-500 text-xs font-bold",
          "transition-colors hover:border-emerald-400/40 hover:text-emerald-400"
        )}
        aria-label="Sign in"
      >
        ?
      </button>
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
