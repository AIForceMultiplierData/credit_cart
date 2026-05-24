"use client"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { HomeView } from "@/components/home-view"
import { DealsFeed, type Deal } from "@/components/deals-feed"
import { LenderFeed } from "@/app/deals/lender-feed"
import { WalletView } from "@/components/wallet-view"
import { ActivityView } from "@/components/activity-view"
import { PingDrawer } from "@/components/ping-drawer"
import { LoginModal } from "@/components/LoginModal"
import { ProfileMenu } from "@/components/profile-menu"
import { ProfileEditModal } from "@/components/profile-edit-modal"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"

type TabType = "home" | "wallet" | "deals" | "activity"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const { user, loading } = useAuth()
  const { profile, refresh: refreshProfile } = useProfile()

  const requiresAuth = activeTab === "wallet" || activeTab === "activity"
  const showLoginModal =
    (requiresAuth && !loading && !user) || (loginOpen && !user)

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal)
    setDrawerOpen(true)
  }

  const handleNavigate = (tab: TabType) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Constraint Container */}
      <div className="max-w-md mx-auto min-h-screen relative border-x border-slate-800 overflow-x-hidden bg-slate-950">
        {/* Status Bar Mockup */}
        <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">P</span>
              </div>
              <span className="text-slate-50 font-bold text-lg">PoolPay</span>
            </div>
            <ProfileMenu
              user={user}
              displayName={profile?.fullName}
              loading={loading}
              onEditProfile={() => setProfileEditOpen(true)}
              onSignIn={() => setLoginOpen(true)}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="min-h-[calc(100vh-72px)]">
          {activeTab === "home" && (
            <HomeView
              onNavigate={handleNavigate}
              onSignIn={() => setLoginOpen(true)}
            />
          )}
          {activeTab === "deals" && (
            <>
              <LenderFeed />
              <DealsFeed onDealClick={handleDealClick} />
            </>
          )}
          {activeTab === "wallet" && <WalletView />}
          {activeTab === "activity" && <ActivityView />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Ping Drawer */}
        <PingDrawer
          deal={selectedDeal}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />

        <LoginModal
          open={showLoginModal}
          onOpenChange={(open) => {
            if (!open) setLoginOpen(false)
          }}
        />

        <ProfileEditModal
          open={profileEditOpen}
          onOpenChange={setProfileEditOpen}
          initialName={profile?.fullName ?? ""}
          onSaved={() => void refreshProfile()}
        />
      </div>
    </div>
  )
}
