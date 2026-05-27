"use client"

import { Button } from "@/components/ui/button"


type NoQualifyingCardPanelProps = {
  platform: string
  estimatedPrice: number | null
  onPingSplit?: () => void
  onBrowseLenders?: () => void
}

export function NoQualifyingCardPanel({
  platform,
  estimatedPrice,
  onPingSplit,
  onBrowseLenders,
}: NoQualifyingCardPanelProps) {
  return (
    <div className="my-4 text-center">
       <p className="text-xs text-muted-foreground">
        No offers for your cards?{' '}
        <a href="/lenders" className="underline" onClick={(e) => { e.preventDefault(); onBrowseLenders?.(); }}>
          Lend & Earn
        </a>
      </p>
    </div>
  )
}
