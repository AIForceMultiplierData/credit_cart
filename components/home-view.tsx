"use client"

import { Sparkles, ArrowRight, TrendingUp, Users, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface HomeViewProps {
  onNavigate: (tab: "deals" | "wallet" | "activity") => void
}

export function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="px-4 pb-32 pt-2">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-purple-500/20" />
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-sm font-semibold">
              Welcome to PoolPay
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2 text-balance">
            Co-Purchase.
            <br />
            <span className="text-emerald-400">Save Together.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Pool credit cards with your trusted circle to unlock exclusive
            discounts on premium products.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/50 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-slate-50 font-bold text-xl">₹45K</p>
          <p className="text-slate-500 text-xs">Saved</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/50 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-slate-50 font-bold text-xl">3</p>
          <p className="text-slate-500 text-xs">Circle</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/50 text-center">
          <Zap className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-slate-50 font-bold text-xl">12</p>
          <p className="text-slate-500 text-xs">Deals</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-slate-50 font-semibold text-lg mb-3">
          Quick Actions
        </h2>

        <button
          onClick={() => onNavigate("deals")}
          className={cn(
            "w-full flex items-center justify-between p-4",
            "rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5",
            "border border-emerald-500/20",
            "hover:border-emerald-500/40 transition-all duration-300",
            "group"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-slate-50 font-semibold">Browse Live Deals</p>
              <p className="text-slate-400 text-sm">5 deals expiring soon</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => onNavigate("wallet")}
          className={cn(
            "w-full flex items-center justify-between p-4",
            "rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-500/5",
            "border border-blue-500/20",
            "hover:border-blue-500/40 transition-all duration-300",
            "group"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-slate-50 font-semibold">Manage Circle</p>
              <p className="text-slate-400 text-sm">4 cards pooled</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => onNavigate("activity")}
          className={cn(
            "w-full flex items-center justify-between p-4",
            "rounded-2xl bg-gradient-to-r from-purple-500/10 to-purple-500/5",
            "border border-purple-500/20",
            "hover:border-purple-500/40 transition-all duration-300",
            "group"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-slate-50 font-semibold">View Activity</p>
              <p className="text-slate-400 text-sm">2 active contracts</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
