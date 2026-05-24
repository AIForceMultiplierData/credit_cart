# User stories & examples

## Story 1 — Priya buys a MacBook on Amazon

**Context:** Priya has HDFC Millennia and Axis Flipkart in her wallet. Her friend Raj has ICICI Amazon Pay in the circle.

| Step | Action | System behavior |
|------|--------|-----------------|
| 1 | Priya pastes `amazon.in/...` MacBook URL on **Home** | URL scraped + Serper + AI rank cards |
| 2 | Price detected ~₹1,30,999 | `estimated_price` from page meta or Serper |
| 3 | Best wallet card shown | ICICI Amazon Pay if in wallet at ~10% Serper → save ₹13,100 |
| 4 | If Priya only has Millennia | Best wallet ~₹6,550; **missing** teaser for Amazon Pay |
| 5 | Priya pings Raj's card | `contracts` insert, `escrow_status = pending_acceptance` |
| 6 | Raj opens **Deals → Lender Desk** | Sees opportunity via `get_lender_opportunities()` |
| 7 | Raj accepts | `lender_id` set, escrow locked, `transactions` row |

**50/50 split example (₹1,30,999, 10% cashback = ₹13,100):**

| Line | Amount |
|------|--------|
| List price | ₹1,30,999 |
| Total cashback on Raj's card | ₹13,100 |
| Priya's share (50%) | ₹6,550 |
| Raj's share (50%) | ₹6,550 |
| Priya's **effective cost** | ₹1,30,999 − ₹6,550 = **₹1,24,449** |

Formula: see [../04-calculations/pool-split.md](../04-calculations/pool-split.md).

---

## Story 2 — Amit applies for a card he does not own

**Context:** Deal search shows **Cards you're missing → Amazon Pay**.

| Step | Action |
|------|--------|
| 1 | Tap **Apply now** |
| 2 | `CreditCardLeadModal` opens (Aadhaar, PAN, salary, PDF uploads) |
| 3 | POST `/api/leads/credit-card` → `credit_card_leads` + Supabase Storage |

No AI on the form — validation is **Zod** + DB constraints.

---

## Story 3 — Sneha browses viral deals without owning Amazon Pay

**Context:** **Deals** tab loads `/api/deals/viral`.

| Step | Behavior |
|------|----------|
| Serper | Fetches trending products (Amazon, Flipkart, eBay queries) |
| Filter | Best catalog card **not in wallet** (circle OK) |
| UI | "Cashback outside your wallet" + 50% split hint |
| CTA | **Apply** or **Ping 50/50** |

---

## Story 4 — Raj lends his card

| Step | Action |
|------|--------|
| 1 | **Wallet** → toggle **Earning on** on ICICI Amazon Pay |
| 2 | `active_for_lending: true` saved via `upsert_my_wallet` RPC |
| 3 | Buyer pings → Raj sees deal on Lender Desk |
| 4 | Accept → earns platform credits = `max(round(discount × 0.15), 99)` |

---

## When PoolPay is **not** useful

- Cash-only merchants with no card offers.
- User already has the best card and does not want to pool.
- Supabase / Serper / LLM keys not configured (degraded mode).
