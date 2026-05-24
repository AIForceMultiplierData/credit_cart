# Ping drawer

**File:** `components/ping-drawer.tsx`

---

## Purpose

Buyer sends a **ping** to the circle after choosing a deal (viral feed or manual flow).

---

## Payload mapping

From `Deal` object:

| Contract field | Deal field |
|----------------|------------|
| `product_name` | `title` |
| `base_price` | `originalPrice` |
| `card_discount_amount` | `cardDiscount` |
| `buyer_id` | auth user id |
| `escrow_status` | `"pending_acceptance"` |

**Calculation:** Values come from upstream deal search or viral feed — not recalculated in drawer.

---

## Insert

```typescript
supabase.from("contracts").insert(payload)
```

Requires `contracts.sql` + buyer insert policy.

---

## UI states

`idle → processing → sent | error`

Shows circle member count from `useProfile().circleMembers`.
