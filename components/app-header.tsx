"use client"

import type { User } from "@supabase/supabase-js"
import { ProfileMenu } from "@/components/profile-menu"
import { QuickActionsDrawer } from "@/components/quick-actions-drawer"
import { cn } from "@/lib/utils"

type TabType = "home" | "wallet" | "deals" | "activity"

type AppHeaderProps = {
  user: User | null
  loading: boolean
  displayName?: string
  onEditProfile: () => void
  onNavigate: (tab: TabType) => void
  onRequestSignIn?: () => void
  className?: string
}

export function AppHeader({
  user,
  loading,
  displayName,
  onEditProfile,
  onNavigate,
  onRequestSignIn,
  className,
}: AppHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-3 sm:px-6",
        !user && !loading && "pb-8",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <QuickActionsDrawer
          onNavigate={(tab) => onNavigate(tab)}
        />
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
            <span className="text-sm font-bold text-slate-900">P</span>
          </div>
          <span className="truncate text-lg font-bold text-slate-50">PoolPay</span>
        </div>
      </div>
      <ProfileMenu
        user={user}
        displayName={displayName}
        loading={loading}
        onEditProfile={onEditProfile}
        onRequestSignIn={onRequestSignIn}
      />
    </div>
  )
}
