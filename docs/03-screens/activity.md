# Activity tab

**File:** `components/activity-view.tsx`

---

## Purpose

Show user's **contracts** (buyer or lender) with status and realtime updates.

---

## Data

```typescript
supabase.from("contracts")
  .select("*")
  .or(`buyer_id.eq.${userId},lender_id.eq.${userId}`)
```

**Source:** DB only — no AI.

---

## Realtime

Supabase channel subscription on `contracts` table for live updates when lender accepts.

---

## Setup required

`supabase/contracts.sql` — RLS policies for buyer/lender read.

If missing, shows setup hint (similar to lender feed).

---

## Status values

From `contracts.escrow_status` check constraint:

`pending_acceptance | escrow_locked | order_placed | completed | disputed | cancelled`
