# RPC functions (security definer)

| Function | Purpose | SQL file |
|----------|---------|----------|
| `get_or_create_my_wallet()` | Read/create profile + cards | `wallet_policies.sql` |
| `upsert_my_wallet(p_cards jsonb)` | Save wallet JSON | `wallet_policies.sql` |
| `normalize_wallet_cards(jsonb)` | Ensure `active_for_lending` | `wallet_lending_toggle.sql` |
| `get_deal_search_cards()` | Wallet + circle cards for search | `circle_wallet.sql` |
| `get_trust_scores(uuid[])` | Buyer trust for lender UI | `lender_feed_fix.sql` |
| `get_lender_opportunities()` | Pending deals for lenders | `lender_feed_fix.sql` / `lender_opportunities_rpc.sql` |

All granted to `authenticated` role unless noted.

---

## Why RPCs?

PostgREST + RLS can block views or JSON updates. Security definer functions run with owner privileges while still checking `auth.uid()` inside SQL.

---

## Client usage

```typescript
await supabase.rpc("get_or_create_my_wallet")
await supabase.rpc("upsert_my_wallet", { p_cards: payload })
await supabase.rpc("get_deal_search_cards")
await supabase.rpc("get_lender_opportunities")
```
