# Missing card teasers

**File:** `lib/deal-search-missing-cards.ts`

---

## Purpose

Suggest **catalog cards the user does not own** that could save more than their current best **wallet** card.

---

## Algorithm

1. Build `walletCards` from `searchCards` where `source === "wallet"`
2. For each `CARD_CATALOG` entry:
   - Skip if `isCardInWallet()` — 📋 identity match (`card-identity.ts`)
   - Compute platform % from 📋 rules + 🔍 Serper
   - `discountAmount = round(price × percent / 100)`
   - Skip if same as best wallet offer (identity match)
   - Skip if `discountAmount <= walletBestAmount`
3. Sort by ₹ saved, Serper flag, in-circle flag
4. Return top N (default 4)

---

## Not shown when

- Card already in wallet (even if ID differs but name matches)
- Savings ≤ current wallet best
- No platform/Serper discount

---

## Apply CTA

Opens credit card lead form — not external bank URL.
