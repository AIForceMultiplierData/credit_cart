# Deals — Lender Desk

**File:** `app/deals/lender-feed.tsx`

---

## Purpose

Show **pending lending opportunities** — contracts where another user (buyer) pinged the circle and needs a card.

---

## Data load (priority order)

| # | Method | Type |
|---|--------|------|
| 1 | `get_lender_opportunities()` RPC | **DB** security definer |
| 2 | View `lender_opportunities` | **DB** |
| 3 | Table `contracts` filtered | **DB** |

SQL: `supabase/lender_feed_fix.sql`, `lender_opportunities_rpc.sql`

---

## Opportunity card fields

| Field | Calculation |
|-------|-------------|
| `base_price` | From contract — **buyer input** at ping time |
| `card_discount_amount` | From contract — from deal/search at ping |
| `escrow_amount` | **Formula:** `max(base_price - card_discount, 0)` |
| `platform_credits` | **Formula:** `max(round(card_discount × 0.15), 99)` |
| `buyer_trust_score` | **DB** via RPC `get_trust_scores` or `profiles.trust_score` |

Not AI.

---

## Accept deal

1. Requires ≥1 wallet card with **Earning on**
2. Updates `contracts`: `lender_id`, `escrow_status = escrow_locked`
3. Inserts `transactions` row type `escrow_deposit`

---

## Empty states

| Message | Meaning |
|---------|---------|
| No open opportunities | DB connected, zero pending contracts |
| Lender Desk is connected | Success — waiting for pings |
| Amber hint | Real error — schema or permission (see setup-order) |

---

## Platform credits formula

```typescript
// lender-feed.tsx
const credits = Math.round(cardDiscount * 0.15)
return Math.max(credits, 99)
```

Example: ₹13,100 discount → ₹1,965 credits.
