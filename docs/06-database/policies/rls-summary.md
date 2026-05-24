# RLS policies summary

Row Level Security is **enabled** on all user tables. Below is intent — see SQL files for exact DDL.

---

## `profiles`

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can read own profile | SELECT | `auth.uid() = id` |
| Users can insert/update own | INSERT/UPDATE | own id |
| Authenticated read trust | SELECT | optional — `lender_policies.sql` |

---

## `contracts`

| Policy | Operation | Rule |
|--------|-----------|------|
| Buyers can read own | SELECT | buyer, lender, OR pending marketplace |
| Buyers can insert own | INSERT | `buyer_id = auth.uid()` |
| Lenders can accept | UPDATE | pending → locked, set lender_id |

**Critical:** `lender_feed_fix.sql` adds `pending_acceptance` visible to all authenticated users so Lender Desk works.

---

## `credit_card_leads`

| Policy | Operation | Rule |
|--------|-----------|------|
| Insert/read own | INSERT/SELECT | `user_id = auth.uid()` |

---

## `storage.objects` (leads bucket)

Users upload only under folder `{user_id}/...`

---

## Grants

`lender_feed_fix.sql`:

```sql
grant select, insert, update on public.contracts to authenticated;
grant execute on function public.get_lender_opportunities() to authenticated;
```

Without grants, client sees "permission denied" even when tables exist.
