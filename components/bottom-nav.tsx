"use client"

import { Home, Wallet, Zap, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

type TabType = "home" | "wallet" | "deals" | "activity"

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "wallet" as const, icon: Wallet, label: "Wallet" },
  { id: "deals" as const, icon: Zap, label: "Deals" },
  { id: "activity" as const, icon: Activity, label: "Activity" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 z-50">
      <div className="mx-4 mb-4 rounded-2xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-around py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                  isActive
                    ? "text-emerald-400"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <div
                  className={cn(
                    "relative p-2 rounded-xl transition-all duration-300",
                    isActive && "bg-emerald-400/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                    )}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
