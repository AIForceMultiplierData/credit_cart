# Tables reference

## `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | = `auth.users.id` |
| `cards` | jsonb | Wallet card array |
| `full_name` | text | Profile edit |
| `trust_score` | int | Default 100, lender UI |
| `total_saved` | numeric? | Home stat (optional migration) |
| `active_deals_count` | int? | Home stat |

**RLS:** User read/write own row only (plus trust read policy for lenders).

---

## `card_catalog`

Reference cards for Add Card modal and deal teasers.

| Column | Type |
|--------|------|
| `card_id` | text PK |
| `bank_name` | text |
| `card_name` | text |
| `style_classes` | text |
| `is_active` | boolean |

Mirror: `lib/card-catalog.ts` for server-side logic.

---

## `circle_members`

Links users in a trust circle. Required for `get_deal_search_cards` RPC.

See `supabase/circle_wallet.sql`.

---

## `contracts`

Co-purchase / ping records.

| Column | Type | Notes |
|--------|------|-------|
| `buyer_id` | uuid | Who initiated ping |
| `lender_id` | uuid? | Set on accept |
| `product_name` | text | |
| `base_price` | numeric | List price at ping |
| `card_discount_amount` | numeric | Expected cashback |
| `escrow_status` | text | State machine |

DDL: `supabase/contracts.sql`

---

## `transactions`

Escrow ledger entries linked to `contracts`.

DDL: `supabase/transactions.sql`

---

## `credit_card_leads`

Application form submissions.

DDL: `supabase/credit_card_leads.sql`

---

## Views

| View | Purpose |
|------|---------|
| `lender_opportunities` | Pending contracts for lender feed |

Prefer RPC `get_lender_opportunities()` for API reliability.
