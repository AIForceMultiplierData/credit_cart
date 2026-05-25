"use client"

import { CardVisual } from "@/components/card-visual"

type CardCatalogThumbnailProps = {
  cardId?: string
  bankName: string
  cardName: string
  styleClasses: string
  bankId?: string | null
  bankLogoUrl?: string | null
  cardImageUrl?: string | null
  className?: string
  subtitle?: React.ReactNode
  size?: "sm" | "md"
}

export function CardCatalogThumbnail({
  cardId = "",
  bankName,
  cardName,
  styleClasses,
  bankId,
  bankLogoUrl,
  cardImageUrl,
  className,
  subtitle,
  size = "sm",
}: CardCatalogThumbnailProps) {
  return (
    <CardVisual
      cardId={cardId || `${bankName}_${cardName}`.toLowerCase().replace(/\s+/g, "_")}
      bankName={bankName}
      cardName={cardName}
      styleClasses={styleClasses}
      bankId={bankId}
      bankLogoUrl={bankLogoUrl}
      cardImageUrl={cardImageUrl}
      className={className}
      subtitle={subtitle}
      size={size}
    />
  )
}
