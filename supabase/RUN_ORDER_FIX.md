# Supabase SQL — fix for your errors

Your `card_catalog.card_id` is **UUID**, not text. Older scripts used slugs like `hdfc_millennia` in `WHERE card_id = ...`, which caused:

`invalid input syntax for type uuid: "hdfc_millennia"`

Analytics failed because `card_banks` was never created (first script stopped at the error).

## Run in this order

### 1. Card master (fixed script)

In SQL Editor, run the **entire** file:

`supabase/card_catalog_master.sql`

This will:

- Create `card_banks` (`bank_id` = `hdfc`, `icici`, `sbi` — not card slugs)
- Add `card_slug` (app card id like `hdfc_millennia`)
- Create `card_catalog_master` view

### 1b. Live card catalog (230 products)

After step 1 succeeds, run:

`supabase/card_catalog_live_seed.sql`

Regenerate after editing master list:

`node scripts/generate-card-catalog-master.mjs`

Column mapping:

| Your paste column | DB / app field |
|-------------------|----------------|
| 1st value (`hdfc_millennia`) | `card_slug` / app `card_id` |
| 2nd value (`HDFC Millennia`) | `card_name` |
| 3rd (`/cards/...svg`) | `card_image_url` |
| 4th (`#hex`) | `brand_color` (bank/card styling) |
| 5th (`bg-gradient...`) | `style_classes` |
| — | `bank_id` = `hdfc`, `icici`, `axis`, … (derived from slug prefix) |

### 2. Indian airports (flight FROM/TO)

Run:

`supabase/indian_airports.sql`

Regenerate from app seed after edits:

`node --experimental-strip-types scripts/generate-indian-airports-sql.mjs`

### 3. Analytics layer

After step 1 succeeds, run:

`supabase/analytics_semantic_layer.sql`

If you still see `column t.id does not exist` on transactions, either:

- Re-run the updated analytics script (it auto-detects `id` vs `transaction_id`), or
- Run `supabase/transactions_schema_repair.sql` then analytics again.

### 4. Verify

```sql
select * from public.card_banks limit 5;
select card_id, card_slug, bank_name, card_name from public.card_catalog_master limit 10;
select * from analytics.v_user_funnel;
select * from analytics.v_contract_funnel;
```

## If step 1 partially ran before

`card_banks` may already exist. Re-running `card_catalog_master.sql` is safe (idempotent).

If you see `42P16: cannot change name of view column "card_name" to "card_image_url"`, the script now drops and recreates the view — run the full file again from the top.

If you see `22P02: invalid input syntax for type uuid: "hdfc_bizgrow"`, your `card_id` column is UUID — use the latest `card_catalog_master.sql` (seeds by `card_slug` only, not text in `card_id`).
