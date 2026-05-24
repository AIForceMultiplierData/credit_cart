# Lender platform credits

**File:** `app/deals/lender-feed.tsx` → `calculatePlatformCredits()`

---

## Formula

```typescript
credits = Math.round(cardDiscount × 0.15)
return Math.max(credits, 99)
```

📐 **Formula** — not AI.

---

## Examples

| Card discount | Credits |
|---------------|---------|
| ₹13,100 | ₹1,965 |
| ₹500 | ₹99 (floor) |
| ₹2,000 | ₹300 |

---

## Escrow amount (display)

```typescript
escrowAmount = Math.max(base_price - card_discount_amount, 0)
```

Shown on opportunity card — informational for lender risk UI.
