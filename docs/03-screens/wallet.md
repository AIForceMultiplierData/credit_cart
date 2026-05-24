# Wallet tab

**Components:** `wallet-view.tsx`, `add-card-modal.tsx`, `wallet-card-lending-toggle.tsx`

---

## Purpose

Manage **Your Circle's Arsenal** — credit cards the user owns, stored in Supabase.

---

## Data model

Cards live in `profiles.cards` as JSON array:

```json
{
  "card_id": "icici_amazon",
  "bank_name": "ICICI",
  "card_name": "Amazon Pay",
  "style_classes": "bg-gradient-to-br ...",
  "active_for_lending": false
}
```

### Load path

1. `useWalletCards` → RPC `get_or_create_my_wallet`
2. Fallback: direct `profiles.cards` select
3. Parse via `lib/wallet-cards.ts` (supports legacy `id/bank/name` shapes)

### Save path

`upsert_my_wallet(p_cards)` — security definer, normalizes `active_for_lending`.

Requires `supabase/wallet_policies.sql` + `wallet_lending_toggle.sql`.

---

## Add card flow

1. Modal loads `card_catalog` table (Supabase)
2. User picks bank → card
3. Append to JSON, call `upsert_my_wallet`

**Calculation:** None — catalog is static DB seed (`card_catalog.sql`).

---

## Earning toggle

| UI label | Field | Meaning |
|----------|-------|---------|
| Earning on | `active_for_lending: true` | Card visible to buyers / Lender Desk eligible |
| Earning off | `false` | Not visible to buyers |
| Subtext | — | "Visible to buyers" / "Not visible to buyers" |

**Calculation:** Boolean flag only. Count shown on home: `countLendingActiveCards()`.

---

## Circle Power widget

Displays: `{lendingActive} lending • {cardCount} cards • synced to Supabase`

**Source:** Client-side count from wallet JSON — not AI.
