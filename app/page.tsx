"use client"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { HomeView } from "@/components/home-view"
import { DealsTabView } from "@/components/deals-tab-view"
import { type Deal } from "@/components/deals-feed"
import { WalletView } from "@/components/wallet-view"
import { ActivityView } from "@/components/activity-view"
import { PingDrawer } from "@/components/ping-drawer"
import { AppHeader } from "@/components/app-header"
import { ProfileEditModal } from "@/components/profile-edit-modal"
import { signInWithGoogle } from "@/lib/sign-in"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"

type TabType = "home" | "wallet" | "deals" | "activity"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const { user, loading } = useAuth()
  const { profile, refresh: refreshProfile } = useProfile()

  const handleSignIn = () => {
    void signInWithGoogle()
  }

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
          <AppHeader
            user={user}
            loading={loading}
            displayName={profile?.fullName}
            onEditProfile={() => setProfileEditOpen(true)}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Main Content Area */}
        <main className="min-h-[calc(100vh-72px)]">
          {activeTab === "home" && (
            <HomeView onNavigate={handleNavigate} onSignIn={handleSignIn} />
          )}
          {activeTab === "deals" && (
            <DealsTabView onDealClick={handleDealClick} />
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
