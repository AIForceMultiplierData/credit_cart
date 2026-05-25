/** 50/50 circle pool economics for ping drawer and deal cards. */

export const POOL_PLATFORM_FEE_LOW = 99
export const POOL_PLATFORM_FEE_HIGH = 199
export const POOL_PLATFORM_FEE_CASHBACK_THRESHOLD = 2500
export const POOL_BENEFIT_SPLIT_RATIO = 0.5

export type PoolPingBreakdown = {
  base_price: number
  card_discount: number
  your_benefit: number
  buddy_benefit: number
  platform_fee: number
  total_pay_now: number
}

export function computePlatformFee(cardDiscount: number): number {
  return cardDiscount > POOL_PLATFORM_FEE_CASHBACK_THRESHOLD
    ? POOL_PLATFORM_FEE_HIGH
    : POOL_PLATFORM_FEE_LOW
}

/** Buyer pays: base price − your 50% cashback share + platform fee. */
export function computePoolPingBreakdown(
  basePrice: number,
  cardDiscount: number
): PoolPingBreakdown {
  const yourBenefit = cardDiscount * POOL_BENEFIT_SPLIT_RATIO
  const buddyBenefit = cardDiscount - yourBenefit
  const platformFee = computePlatformFee(cardDiscount)
  const totalPayNow = basePrice - yourBenefit + platformFee

  return {
    base_price: basePrice,
    card_discount: cardDiscount,
    your_benefit: yourBenefit,
    buddy_benefit: buddyBenefit,
    platform_fee: platformFee,
    total_pay_now: totalPayNow,
  }
}

export function formatPoolInr(amount: number): string {
  const rounded = Math.round(amount * 10) / 10
  if (Number.isInteger(rounded)) {
    return `₹${rounded.toLocaleString("en-IN")}`
  }
  return `₹${rounded.toLocaleString("en-IN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`
}
