"use client"

import { Zap, TrendingDown, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Deal {
  id: string
  title: string
  originalPrice: number
  discountedPrice: number
  cardName: string
  cardDiscount: number
  timeLeft: string
  image?: string
  isDemo?: boolean
}

const mockDeals: Deal[] = [
  {
    id: "1",
    title: "Apple MacBook Air M2",
    originalPrice: 99999,
    discountedPrice: 75000,
    cardName: "HDFC",
    cardDiscount: 5000,
    timeLeft: "2h 30m",
    isDemo: true,
  },
  {
    id: "2",
    title: "Sony WH-1000XM5 Headphones",
    originalPrice: 29990,
    discountedPrice: 22990,
    cardName: "ICICI",
    cardDiscount: 2000,
    timeLeft: "4h 15m",
    isDemo: true,
  },
  {
    id: "3",
    title: "iPhone 15 Pro Max 256GB",
    originalPrice: 159900,
    discountedPrice: 139900,
    cardName: "SBI",
    cardDiscount: 10000,
    timeLeft: "1h 45m",
    isDemo: true,
  },
  {
    id: "4",
    title: 'Samsung 65" OLED TV',
    originalPrice: 189990,
    discountedPrice: 159990,
    cardName: "Axis",
    cardDiscount: 15000,
    timeLeft: "5h 00m",
    isDemo: true,
  },
  {
    id: "5",
    title: "PlayStation 5 Console",
    originalPrice: 54990,
    discountedPrice: 44990,
    cardName: "HDFC",
    cardDiscount: 5000,
    timeLeft: "3h 20m",
    isDemo: true,
  },
]

interface DealsFeedProps {
  onDealClick: (deal: Deal) => void
}

export function DealsFeed({ onDealClick }: DealsFeedProps) {
  return (
    <div className="px-4 pb-32 pt-2">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
            Live Price Drops
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-50 text-balance">
          Pool Cards. Unlock Deals.
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Sample deals below — tap to ping your circle
        </p>
      </div>

      {/* Deals Grid */}
      <div className="space-y-4">
        {mockDeals.map((deal) => (
          <button
            key={deal.id}
            onClick={() => onDealClick(deal)}
            className="w-full text-left group"
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-slate-900/60 backdrop-blur-md",
                "border border-slate-800/50",
                "p-4 transition-all duration-300",
                "hover:border-emerald-400/30 hover:bg-slate-900/80",
                "active:scale-[0.98]"
              )}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-slate-50 font-semibold text-lg leading-tight truncate group-hover:text-emerald-400 transition-colors">
                      {deal.title}
                    </h3>
                    {deal.isDemo ? (
                      <span className="shrink-0 rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Demo
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-slate-500 line-through text-sm">
                      ₹{deal.originalPrice.toLocaleString()}
                    </span>
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700/50">
                    <Zap className="w-8 h-8 text-emerald-400/60" />
                  </div>
                </div>
              </div>

              {/* Price Badge */}
              <div className="mt-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
                  <span className="text-emerald-400 font-bold text-lg">
                    ₹{deal.discountedPrice.toLocaleString()}
                  </span>
                  <span className="text-emerald-400/80 text-sm">
                    with {deal.cardName} Card
                  </span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/50">
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{deal.timeLeft}</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium uppercase tracking-wide">
                  Tap to Ping →
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
