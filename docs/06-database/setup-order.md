# Database setup — run order

Execute scripts in **Supabase Dashboard → SQL Editor** in this order. Each file lives in repo folder `supabase/`.

| # | File | Creates / fixes |
|---|------|-----------------|
| 1 | `profiles.sql` | `profiles` table, RLS, signup trigger |
| 2 | `card_catalog.sql` | `card_catalog` reference table |
| 2b | `card_catalog_master.sql` | `card_banks` dimension + enriched `card_catalog_master` view |
| 9 | `analytics_semantic_layer.sql` | Analytics facts/dimensions + funnel views |
| 3 | `wallet_policies.sql` | `get_or_create_my_wallet`, `upsert_my_wallet` RPCs |
| 4 | `profile_edit.sql` | `full_name` and profile edit fields |
| 5 | `trust_score.sql` | `trust_score`, `get_trust_scores` RPC |
| 6 | `circle_wallet.sql` | `circle_members`, `get_deal_search_cards` RPC |
| 7 | `contracts.sql` | `contracts` table + base RLS |
| 7b | `contracts_schema_repair.sql` | **Run if `column id does not exist` on contracts** |
| 8 | `transactions.sql` | `transactions` ledger |
| 9 | `lender_feed_fix.sql` | Lender RLS, view, trust, **`get_lender_opportunities`** |
| 10 | `lender_opportunities_rpc.sql` | Standalone RPC patch (if step 9 already run) |
| 11 | `wallet_lending_toggle.sql` | `active_for_lending` normalization |
| 12 | `credit_card_leads.sql` | Leads table + storage bucket |
| 13 | `profile_dashboard_stats.sql` | Home stats columns |
| 14 | `fulfillment.sql` | Order fulfillment flow (optional) |
| 15 | `disputes.sql` | Dispute flow (optional) |
| 16 | `admin_policies.sql` | Admin dashboard access (optional) |
| 17 | `lender_policies.sql` | Alternate/extra lender policies (if needed) |

---

## Verify after setup

```sql
-- Should return rows (may be empty)
select * from public.get_lender_opportunities();

-- Should return wallet JSON
select public.get_or_create_my_wallet();
```

---

## Subfolder reference (documentation mirror)

Detailed DDL notes:

- [tables/](./tables/) — column-level reference
- [functions/](./functions/) — RPC list
- [policies/](./policies/) — RLS summary

Source SQL always remains in `/supabase/*.sql` at repo root.

---

## Auth setup

1. Supabase → Authentication → Providers → Google ON
2. Add redirect URL: `https://poolpay.forcemultiplierdata.com/**` and `http://localhost:3000/**`

---

## Storage

Bucket `credit-card-leads` — private, 2MB limit, PDF/images. Created in `credit_card_leads.sql`.
