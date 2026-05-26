"use client"

import { useEffect, useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { HomeView } from "@/components/home-view"
import { DealsTabView } from "@/components/deals-tab-view"
import { type Deal } from "@/components/deals-feed"
import { WalletView } from "@/components/wallet-view"
import { ActivityView } from "@/components/activity-view"
import { PingDrawer } from "@/components/ping-drawer"
import { AppHeader } from "@/components/app-header"
import { ProfileEditModal } from "@/components/profile-edit-modal"
import { LoginModal } from "@/components/LoginModal"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"

type TabType = "home" | "wallet" | "deals" | "activity"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const { profile, refresh: refreshProfile } = useProfile()

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const fromWhatsApp =
      params.get("from") === "whatsapp" ||
      params.get("invite") != null ||
      params.has("utm_source")
    if (fromWhatsApp) {
      setInviteMessage(
        "Your friend invited you to PoolPay — sign in to split bills 50/50 and save together."
      )
      setLoginOpen(true)
      const clean = new URL(window.location.href)
      clean.searchParams.delete("from")
      clean.searchParams.delete("invite")
      window.history.replaceState({}, "", clean.pathname + clean.hash)
    }
  }, [])

  const openSignIn = () => setLoginOpen(true)

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal)
    setDrawerOpen(true)
  }

  const handleNavigate = (tab: TabType) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen w-full bg-slate-950">
      <div className="relative mx-auto min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-950 md:max-w-md md:border-x md:border-slate-800">
        <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <AppHeader
            user={user}
            loading={loading}
            displayName={profile?.fullName}
            onEditProfile={() => setProfileEditOpen(true)}
            onNavigate={handleNavigate}
            onRequestSignIn={openSignIn}
          />
        </div>

        <main className="min-h-[calc(100vh-72px)]">
          {activeTab === "home" && (
            <HomeView
              onNavigate={handleNavigate}
              onSignIn={openSignIn}
              onPingFromSearch={(deal) => {
                setSelectedDeal(deal)
                setDrawerOpen(true)
              }}
            />
          )}
          {activeTab === "deals" && (
            <DealsTabView onDealClick={handleDealClick} />
          )}
          {activeTab === "wallet" && <WalletView />}
          {activeTab === "activity" && <ActivityView />}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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

        <LoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          inviteMessage={inviteMessage}
        />
      </div>
    </div>
  )
}
