-- PoolPay CARD CATALOG — single-run bundle (AUTO-GENERATED)
-- Paste and run this ENTIRE file once in Supabase Dashboard → SQL Editor.
-- Regenerate: node scripts/generate-card-catalog-master.mjs
--
-- Combines (in order):
--   1. supabase/card_catalog.sql         — base table (legacy seed only if card_id is text)
--   2. supabase/card_catalog_master.sql  — card_banks, columns, view
--   3. supabase/card_catalog_live_seed.sql — 230 live cards upsert
--
-- Recommended prerequisite (run separately if needed): supabase/profiles.sql



-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1/3 — Base card_catalog table
-- Source: supabase/card_catalog.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- PoolPay card catalog base (run after profiles.sql)
-- Legacy text-slug seed runs ONLY when card_id is text (skipped when card_id is uuid).

create table if not exists public.card_catalog (
  card_id text primary key,
  bank_name text not null,
  card_name text not null,
  style_classes text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.card_catalog enable row level security;

drop policy if exists "Anyone can read active card catalog" on public.card_catalog;
create policy "Anyone can read active card catalog"
  on public.card_catalog for select
  using (is_active = true);

-- Skip on UUID PK — use card_catalog_live_seed.sql / card_catalog_full_setup.sql instead.
do $$
declare
  card_id_type text;
begin
  select c.data_type into card_id_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'card_catalog'
    and c.column_name = 'card_id';

  if card_id_type is distinct from 'uuid' then
    insert into public.card_catalog (card_id, bank_name, card_name, style_classes) values
      ('hdfc_millennia', 'HDFC', 'Millennia', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100'),
      ('hdfc_regalia', 'HDFC', 'Regalia Gold', 'bg-gradient-to-br from-yellow-700 to-amber-950 text-yellow-100'),
      ('hdfc_diners', 'HDFC', 'Diners Club Black', 'bg-gradient-to-br from-zinc-900 to-black text-slate-300'),
      ('hdfc_swiggy', 'HDFC', 'Swiggy', 'bg-gradient-to-br from-orange-500 to-purple-800 text-white'),
      ('hdfc_freedom', 'HDFC', 'Freedom', 'bg-gradient-to-br from-blue-800 to-blue-950 text-white'),
      ('hdfc_bizgrow', 'HDFC', 'BizGrow', 'bg-gradient-to-br from-blue-900 to-indigo-950 text-blue-100'),
      ('hdfc_iocl', 'HDFC', 'IndianOil', 'bg-gradient-to-br from-amber-700 to-orange-950 text-amber-100'),
      ('hdfc_irctc', 'HDFC', 'IRCTC', 'bg-gradient-to-br from-sky-700 to-blue-950 text-sky-100'),
      ('hdfc_pixel_play', 'HDFC', 'Pixel Play', 'bg-gradient-to-br from-cyan-600 to-blue-900 text-cyan-100'),
      ('sbi_elite', 'SBI', 'Elite', 'bg-gradient-to-br from-slate-800 to-blue-950 text-white'),
      ('sbi_prime', 'SBI', 'PRIME', 'bg-gradient-to-br from-slate-900 to-emerald-950 text-white'),
      ('sbi_cashback', 'SBI', 'Cashback Card', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white'),
      ('sbi_simplyclick', 'SBI', 'SimplyCLICK', 'bg-gradient-to-br from-teal-400 to-emerald-700 text-white'),
      ('icici_amazon', 'ICICI', 'Amazon Pay', 'bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100'),
      ('icici_sapphiro', 'ICICI', 'Sapphiro', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200'),
      ('icici_coral', 'ICICI', 'Coral', 'bg-gradient-to-br from-orange-700 to-red-950 text-orange-100'),
      ('icici_emeralde', 'ICICI', 'Emeralde', 'bg-gradient-to-br from-emerald-800 to-green-950 text-emerald-100'),
      ('icici_rubyx', 'ICICI', 'Rubyx', 'bg-gradient-to-br from-red-800 to-rose-950 text-red-100'),
      ('axis_flipkart', 'AXIS', 'Flipkart Axis', 'bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white'),
      ('axis_magnus', 'AXIS', 'Magnus', 'bg-gradient-to-br from-zinc-800 to-red-950 text-red-100')
    on conflict (card_id) do update set
      bank_name = excluded.bank_name,
      card_name = excluded.card_name,
      style_classes = excluded.style_classes,
      is_active = true;
  end if;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2/3 — Banks master + card_catalog_master view
-- Source: supabase/card_catalog_master.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- PoolPay card master dimension (run in Supabase SQL Editor)
-- Safe for card_catalog.card_id = text OR uuid (adds card_slug for app slugs like hdfc_millennia)

-- ── Step 1: Banks master (always run this block first) ─────────────────────────
create table if not exists public.card_banks (
  bank_id text primary key,
  bank_name text not null unique,
  logo_url text not null,
  brand_color text not null default '#64748B',
  style_classes text not null,
  display_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.card_banks enable row level security;

drop policy if exists "Anyone can read active card banks" on public.card_banks;
create policy "Anyone can read active card banks"
  on public.card_banks for select
  using (is_active = true);

-- logo_url stores Clearbit domain; app builds https://logo.clearbit.com/{domain}
insert into public.card_banks (bank_id, bank_name, logo_url, brand_color, style_classes, display_order) values
  ('hdfc', 'HDFC', 'hdfcbank.com', '#004C8F', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 10),
  ('sbi', 'SBI', 'onlinesbi.sbi', '#0096D6', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white', 20),
  ('icici', 'ICICI', 'icicibank.com', '#F37021', 'bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100', 30),
  ('axis', 'AXIS', 'axisbank.com', '#971237', 'bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white', 40),
  ('kotak', 'KOTAK', 'kotak.com', '#ED1C24', 'bg-gradient-to-br from-red-700 to-red-950 text-red-100', 50),
  ('idfc', 'IDFC', 'idfcfirstbank.com', '#9D2235', 'bg-gradient-to-br from-rose-800 to-slate-900 text-rose-100', 60),
  ('indusind', 'INDUSIND', 'indusind.com', '#832729', 'bg-gradient-to-br from-amber-800 to-red-950 text-amber-100', 70),
  ('pnb', 'PNB', 'pnbindia.in', '#7D1935', 'bg-gradient-to-br from-red-900 to-amber-950 text-amber-100', 80),
  ('bob', 'BOB', 'bankofbaroda.in', '#F57C00', 'bg-gradient-to-br from-orange-600 to-red-800 text-white', 90),
  ('canara', 'CANARA', 'canarabank.com', '#0084C7', 'bg-gradient-to-br from-blue-600 to-yellow-700 text-white', 100),
  ('union', 'UNION', 'unionbankofindia.co.in', '#D71920', 'bg-gradient-to-br from-red-600 to-blue-800 text-white', 110),
  ('boi', 'BOI', 'bankofindia.co.in', '#0054A6', 'bg-gradient-to-br from-blue-800 to-orange-700 text-white', 120),
  ('iob', 'IOB', 'iob.in', '#0054A6', 'bg-gradient-to-br from-blue-700 to-orange-600 text-white', 130),
  ('idbi', 'IDBI', 'idbibank.in', '#008C3A', 'bg-gradient-to-br from-green-700 to-orange-800 text-white', 140),
  ('yes', 'YES', 'yesbank.in', '#004A8F', 'bg-gradient-to-br from-blue-800 to-slate-900 text-blue-100', 150),
  ('rbl', 'RBL', 'rblbank.com', '#0054A6', 'bg-gradient-to-br from-blue-700 to-slate-900 text-white', 160),
  ('hsbc', 'HSBC', 'hsbc.co.in', '#DB0011', 'bg-gradient-to-br from-red-700 to-slate-900 text-white', 170),
  ('amex', 'AMEX', 'americanexpress.com', '#006FCF', 'bg-gradient-to-br from-blue-700 to-slate-800 text-white', 180),
  ('citi', 'CITI', 'citi.com', '#004B8D', 'bg-gradient-to-br from-blue-800 to-red-900 text-white', 190),
  ('sc', 'SC', 'sc.com', '#00857F', 'bg-gradient-to-br from-teal-600 to-green-700 text-white', 200),
  ('au', 'AU', 'aubank.in', '#6B21A8', 'bg-gradient-to-br from-purple-700 to-orange-600 text-white', 210),
  ('central', 'CENTRAL', 'centralbankofindia.co.in', '#004B8D', 'bg-gradient-to-br from-blue-800 to-slate-900 text-white', 220),
  ('uco', 'UCO', 'ucobank.com', '#0054A6', 'bg-gradient-to-br from-blue-700 to-slate-900 text-white', 230),
  ('indian', 'INDIAN', 'indianbank.in', '#0054A6', 'bg-gradient-to-br from-blue-800 to-blue-950 text-white', 240),
  ('bom', 'BOM', 'bankofmaharashtra.in', '#0054A6', 'bg-gradient-to-br from-blue-700 to-indigo-900 text-white', 250)
on conflict (bank_id) do update set
  bank_name = excluded.bank_name,
  logo_url = excluded.logo_url,
  brand_color = excluded.brand_color,
  style_classes = excluded.style_classes,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- ── Step 2: Extend card_catalog (no slug in WHERE on uuid PK) ─────────────────
alter table public.card_catalog
  add column if not exists card_slug text,
  add column if not exists bank_id text,
  add column if not exists bank_logo_url text,
  add column if not exists card_image_url text,
  add column if not exists network text,
  add column if not exists card_tier text,
  add column if not exists apply_url text,
  add column if not exists annual_fee_inr int,
  add column if not exists updated_at timestamptz default now();

-- FK only if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'card_catalog_bank_id_fkey'
  ) then
    alter table public.card_catalog
      add constraint card_catalog_bank_id_fkey
      foreign key (bank_id) references public.card_banks (bank_id);
  end if;
exception
  when others then null;
end $$;

-- (Pre-seed slug overrides omitted in full_setup — live seed upserts by card_slug.)

create unique index if not exists card_catalog_card_slug_key
  on public.card_catalog (card_slug)
  where card_slug is not null;

-- Backfill bank_id + logo from bank_name
update public.card_catalog c
set
  bank_id = b.bank_id,
  bank_logo_url = b.logo_url,
  updated_at = coalesce(c.updated_at, now())
from public.card_banks b
where upper(c.bank_name) = upper(b.bank_name);

-- Seed apply URLs by bank + card name (NOT by uuid/text card_id)
update public.card_catalog
set apply_url = 'https://www.hdfc.bank.in/credit-cards/millenia-credit-card', network = 'visa', card_tier = 'mid'
where upper(bank_name) = 'HDFC' and card_name ilike '%millennia%';

update public.card_catalog
set apply_url = 'https://www.hdfc.bank.in/credit-cards/regalia-gold-credit-card', network = 'visa', card_tier = 'premium'
where upper(bank_name) = 'HDFC' and card_name ilike '%regalia%';

update public.card_catalog
set apply_url = 'https://www.hdfc.bank.in/credit-cards/diners-club-black-credit-card', network = 'diners', card_tier = 'premium'
where upper(bank_name) = 'HDFC' and (card_name ilike '%diners%' or card_name ilike '%black%');

update public.card_catalog
set apply_url = 'https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.page', network = 'visa', card_tier = 'entry'
where upper(bank_name) = 'SBI' and card_name ilike '%cashback%';

update public.card_catalog
set apply_url = 'https://www.sbicard.com/en/personal/credit-cards/simplyclick-sbi-card.page', network = 'visa', card_tier = 'entry'
where upper(bank_name) = 'SBI' and card_name ilike '%simplyclick%';

update public.card_catalog
set apply_url = 'https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-icici-bank-credit-card', network = 'visa', card_tier = 'mid'
where upper(bank_name) = 'ICICI' and card_name ilike '%amazon%';

update public.card_catalog
set apply_url = 'https://www.icicibank.com/personal-banking/cards/credit-card/sapphiro-credit-card', network = 'mastercard', card_tier = 'premium'
where upper(bank_name) = 'ICICI' and card_name ilike '%sapphiro%';

update public.card_catalog
set apply_url = 'https://www.axis.bank.in/cards/credit-card/flipkart-axis-bank-credit-card', network = 'visa', card_tier = 'mid'
where upper(bank_name) = 'AXIS' and card_name ilike '%flipkart%';

update public.card_catalog
set apply_url = 'https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card', network = 'visa', card_tier = 'premium'
where upper(bank_name) = 'AXIS' and card_name ilike '%magnus%';

-- ── Step 3: Enriched view (card_id = slug for app compatibility) ───────────────
-- DROP required when adding/reordering columns (CREATE OR REPLACE cannot rename by position).
drop view if exists public.card_catalog_master;

create view public.card_catalog_master as
select
  coalesce(c.card_slug, c.card_id::text) as card_id,
  c.card_id as card_uuid,
  c.card_slug,
  c.bank_id,
  c.bank_name,
  coalesce(c.bank_logo_url, b.logo_url) as bank_logo_url,
  c.card_image_url,
  c.card_name,
  c.style_classes,
  c.network,
  c.card_tier,
  c.apply_url,
  c.annual_fee_inr,
  c.is_active,
  b.brand_color,
  b.style_classes as bank_style_classes,
  b.display_order as bank_display_order,
  c.created_at,
  c.updated_at
from public.card_catalog c
left join public.card_banks b on b.bank_id = c.bank_id
where c.is_active = true;

grant select on public.card_banks to authenticated, anon;
grant select on public.card_catalog_master to authenticated, anon;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3/3 — Live seed (230 cards)
-- Source: supabase/card_catalog_live_seed.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- AUTO-GENERATED by scripts/generate-card-catalog-master.mjs — do not edit by hand
-- card_slug = app id (e.g. hdfc_millennia); bank_id = bank key (e.g. hdfc)

-- Upsert all live cards (UUID PK: omit card_id; text PK: uses card_slug as card_id)
do $$
declare
  card_id_type text;
begin
  select c.data_type into card_id_type
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'card_catalog' and c.column_name = 'card_id';

  if card_id_type = 'uuid' then
    insert into public.card_catalog (bank_name, card_name, style_classes, card_slug, bank_id, card_image_url, is_active)
    select v.bank_name, v.card_name, v.style_classes, v.card_slug, v.bank_id, v.card_image_url, true
    from (values
  ('HDFC', 'HDFC Infinia Metal', 'bg-gradient-to-br from-slate-900 to-black text-slate-200', 'hdfc_infinia', 'hdfc', '/cards/hdfc_infinia.svg'),
  ('HDFC', 'HDFC Diners Club Black', 'bg-gradient-to-br from-black to-zinc-900 text-zinc-300', 'hdfc_diners_black', 'hdfc', '/cards/hdfc_diners_black.svg'),
  ('HDFC', 'HDFC Regalia Gold', 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-yellow-50', 'hdfc_regalia_gold', 'hdfc', '/cards/hdfc_regalia_gold.svg'),
  ('HDFC', 'HDFC Millennia', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 'hdfc_millennia', 'hdfc', '/cards/hdfc_millennia.svg'),
  ('HDFC', 'Tata Neu Infinity HDFC', 'bg-gradient-to-br from-purple-900 to-violet-950 text-purple-100', 'hdfc_tata_neu_infinity', 'hdfc', '/cards/hdfc_tata_neu_infinity.svg'),
  ('HDFC', 'Tata Neu Plus HDFC', 'bg-gradient-to-br from-indigo-900 to-blue-950 text-indigo-100', 'hdfc_tata_neu_plus', 'hdfc', '/cards/hdfc_tata_neu_plus.svg'),
  ('HDFC', 'Swiggy HDFC', 'bg-gradient-to-br from-orange-500 to-black text-orange-50', 'hdfc_swiggy', 'hdfc', '/cards/hdfc_swiggy.svg'),
  ('HDFC', 'HDFC MoneyBack+', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100', 'hdfc_moneyback_plus', 'hdfc', '/cards/hdfc_moneyback_plus.svg'),
  ('HDFC', 'IndianOil HDFC', 'bg-gradient-to-br from-orange-600 to-orange-800 text-orange-50', 'hdfc_indianoil', 'hdfc', '/cards/hdfc_indianoil.svg'),
  ('HDFC', 'HDFC Freedom', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'hdfc_freedom', 'hdfc', '/cards/hdfc_freedom.svg'),
  ('ICICI', 'ICICI Emeralde Private', 'bg-gradient-to-br from-emerald-900 to-green-950 text-emerald-100', 'icici_emeralde_private', 'icici', '/cards/icici_emeralde_private.svg'),
  ('ICICI', 'ICICI Sapphiro', 'bg-gradient-to-br from-blue-800 to-indigo-950 text-blue-100', 'icici_sapphiro', 'icici', '/cards/icici_sapphiro.svg'),
  ('ICICI', 'ICICI Rubyx', 'bg-gradient-to-br from-rose-800 to-red-950 text-rose-100', 'icici_rubyx', 'icici', '/cards/icici_rubyx.svg'),
  ('ICICI', 'ICICI Coral', 'bg-gradient-to-br from-rose-500 to-pink-800 text-rose-50', 'icici_coral', 'icici', '/cards/icici_coral.svg'),
  ('ICICI', 'Amazon Pay ICICI', 'bg-gradient-to-br from-orange-600 to-red-900 text-orange-50', 'icici_amazon_pay', 'icici', '/cards/icici_amazon_pay.svg'),
  ('ICICI', 'MakeMyTrip ICICI Signature', 'bg-gradient-to-br from-zinc-900 to-black text-zinc-200', 'icici_mmt_signature', 'icici', '/cards/icici_mmt_signature.svg'),
  ('ICICI', 'MakeMyTrip ICICI Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'icici_mmt_platinum', 'icici', '/cards/icici_mmt_platinum.svg'),
  ('ICICI', 'Adani One ICICI Signature', 'bg-gradient-to-br from-black to-yellow-900 text-yellow-500', 'icici_adani_signature', 'icici', '/cards/icici_adani_signature.svg'),
  ('ICICI', 'ICICI HPCL Super Saver', 'bg-gradient-to-br from-red-600 to-blue-900 text-red-50', 'icici_hpcl_super_saver', 'icici', '/cards/icici_hpcl_super_saver.svg'),
  ('ICICI', 'ICICI Manchester United', 'bg-gradient-to-br from-red-700 to-red-900 text-red-50', 'icici_man_utd', 'icici', '/cards/icici_man_utd.svg'),
  ('SBI', 'SBI Card Aurum', 'bg-gradient-to-br from-black to-zinc-800 text-amber-500', 'sbi_aurum', 'sbi', '/cards/sbi_aurum.svg'),
  ('SBI', 'SBI Card Elite', 'bg-gradient-to-br from-blue-900 to-slate-900 text-amber-400', 'sbi_elite', 'sbi', '/cards/sbi_elite.svg'),
  ('SBI', 'Cashback SBI Card', 'bg-gradient-to-br from-cyan-600 to-blue-900 text-cyan-50', 'sbi_cashback', 'sbi', '/cards/sbi_cashback.svg'),
  ('SBI', 'SimplyCLICK SBI Card', 'bg-gradient-to-br from-sky-600 to-blue-700 text-sky-50', 'sbi_simplyclick', 'sbi', '/cards/sbi_simplyclick.svg'),
  ('SBI', 'SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'sbi_simplysave', 'sbi', '/cards/sbi_simplysave.svg'),
  ('SBI', 'SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'sbi_prime', 'sbi', '/cards/sbi_prime.svg'),
  ('SBI', 'SBI Card PULSE', 'bg-gradient-to-br from-purple-800 to-fuchsia-950 text-purple-100', 'sbi_pulse', 'sbi', '/cards/sbi_pulse.svg'),
  ('SBI', 'BPCL SBI Card OCTANE', 'bg-gradient-to-br from-slate-700 to-slate-900 text-green-400', 'sbi_bpcl_octane', 'sbi', '/cards/sbi_bpcl_octane.svg'),
  ('SBI', 'Club Vistara SBI Card PRIME', 'bg-gradient-to-br from-indigo-900 to-violet-950 text-amber-500', 'sbi_club_vistara_prime', 'sbi', '/cards/sbi_club_vistara_prime.svg'),
  ('SBI', 'Reliance SBI Card PRIME', 'bg-gradient-to-br from-red-600 to-red-900 text-red-50', 'sbi_reliance_prime', 'sbi', '/cards/sbi_reliance_prime.svg'),
  ('AXIS', 'Axis Bank Reserve', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'axis_reserve', 'axis', '/cards/axis_reserve.svg'),
  ('AXIS', 'Axis Bank Magnus', 'bg-gradient-to-br from-red-900 to-rose-950 text-red-100', 'axis_magnus', 'axis', '/cards/axis_magnus.svg'),
  ('AXIS', 'Axis Bank ATLAS', 'bg-gradient-to-br from-slate-500 to-slate-800 text-slate-100', 'axis_atlas', 'axis', '/cards/axis_atlas.svg'),
  ('AXIS', 'Flipkart Axis Bank', 'bg-gradient-to-br from-blue-600 to-blue-800 text-yellow-400', 'axis_flipkart', 'axis', '/cards/axis_flipkart.svg'),
  ('AXIS', 'Axis Bank ACE', 'bg-gradient-to-br from-teal-500 to-teal-800 text-teal-50', 'axis_ace', 'axis', '/cards/axis_ace.svg'),
  ('AXIS', 'Airtel Axis Bank', 'bg-gradient-to-br from-rose-600 to-black text-rose-50', 'axis_airtel', 'axis', '/cards/axis_airtel.svg'),
  ('AXIS', 'Axis Bank Neo', 'bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50', 'axis_neo', 'axis', '/cards/axis_neo.svg'),
  ('AXIS', 'Axis Bank MY ZONE', 'bg-gradient-to-br from-gray-700 to-black text-red-500', 'axis_my_zone', 'axis', '/cards/axis_my_zone.svg'),
  ('AXIS', 'Axis Bank Vistara Infinite', 'bg-gradient-to-br from-violet-800 to-violet-950 text-yellow-500', 'axis_vistara_infinite', 'axis', '/cards/axis_vistara_infinite.svg'),
  ('AXIS', 'Axis Bank SELECT', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'axis_select', 'axis', '/cards/axis_select.svg'),
  ('KOTAK', 'Kotak White Reserve', 'bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800', 'kotak_white_reserve', 'kotak', '/cards/kotak_white_reserve.svg'),
  ('KOTAK', 'Kotak Zen Signature', 'bg-gradient-to-br from-gray-700 to-gray-900 text-gray-100', 'kotak_zen_signature', 'kotak', '/cards/kotak_zen_signature.svg'),
  ('KOTAK', 'Kotak Privy League Signature', 'bg-gradient-to-br from-blue-900 to-indigo-950 text-yellow-500', 'kotak_privy_league', 'kotak', '/cards/kotak_privy_league.svg'),
  ('KOTAK', 'Kotak Royale Signature', 'bg-gradient-to-br from-blue-700 to-blue-900 text-yellow-400', 'kotak_royale_signature', 'kotak', '/cards/kotak_royale_signature.svg'),
  ('KOTAK', 'Kotak League Platinum', 'bg-gradient-to-br from-red-600 to-red-800 text-red-50', 'kotak_league_platinum', 'kotak', '/cards/kotak_league_platinum.svg'),
  ('KOTAK', 'Kotak Mojo Platinum', 'bg-gradient-to-br from-black to-zinc-800 text-yellow-500', 'kotak_mojo_platinum', 'kotak', '/cards/kotak_mojo_platinum.svg'),
  ('KOTAK', 'Kotak 811 #DreamDifferent', 'bg-gradient-to-br from-red-700 to-red-900 text-white', 'kotak_811', 'kotak', '/cards/kotak_811.svg'),
  ('KOTAK', 'Kotak PVR Platinum', 'bg-gradient-to-br from-gray-800 to-black text-yellow-500', 'kotak_pvr_platinum', 'kotak', '/cards/kotak_pvr_platinum.svg'),
  ('KOTAK', 'IndianOil Kotak', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'kotak_indianoil', 'kotak', '/cards/kotak_indianoil.svg'),
  ('KOTAK', 'Kotak Myntra', 'bg-gradient-to-br from-pink-600 to-purple-700 text-pink-50', 'kotak_myntra', 'kotak', '/cards/kotak_myntra.svg'),
  ('IDFC', 'FIRST Private', 'bg-gradient-to-br from-black to-zinc-900 text-zinc-300', 'idfc_private', 'idfc', '/cards/idfc_private.svg'),
  ('IDFC', 'FIRST Mayura', 'bg-gradient-to-br from-teal-700 to-teal-950 text-amber-400', 'idfc_mayura', 'idfc', '/cards/idfc_mayura.svg'),
  ('IDFC', 'FIRST Ashva', 'bg-gradient-to-br from-amber-800 to-amber-950 text-amber-200', 'idfc_ashva', 'idfc', '/cards/idfc_ashva.svg'),
  ('IDFC', 'FIRST Wealth', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 'idfc_wealth', 'idfc', '/cards/idfc_wealth.svg'),
  ('IDFC', 'FIRST Select', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'idfc_select', 'idfc', '/cards/idfc_select.svg'),
  ('IDFC', 'FIRST Millennia', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'idfc_millennia', 'idfc', '/cards/idfc_millennia.svg'),
  ('IDFC', 'FIRST Classic', 'bg-gradient-to-br from-red-800 to-red-950 text-red-50', 'idfc_classic', 'idfc', '/cards/idfc_classic.svg'),
  ('IDFC', 'FIRST WOW!', 'bg-gradient-to-br from-gray-600 to-gray-800 text-gray-100', 'idfc_wow', 'idfc', '/cards/idfc_wow.svg'),
  ('IDFC', 'FIRST Power+', 'bg-gradient-to-br from-red-700 to-red-900 text-red-50', 'idfc_power_plus', 'idfc', '/cards/idfc_power_plus.svg'),
  ('IDFC', 'IndiGo IDFC FIRST', 'bg-gradient-to-br from-indigo-600 to-indigo-900 text-indigo-50', 'idfc_indigo', 'idfc', '/cards/idfc_indigo.svg'),
  ('INDUSIND', 'IndusInd Bank Legend', 'bg-gradient-to-br from-red-900 to-orange-950 text-red-100', 'indusind_legend', 'indusind', '/cards/indusind_legend.svg'),
  ('INDUSIND', 'IndusInd Bank Pinnacle', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'indusind_pinnacle', 'indusind', '/cards/indusind_pinnacle.svg'),
  ('INDUSIND', 'IndusInd Bank Aura Edge', 'bg-gradient-to-br from-blue-900 to-slate-900 text-slate-200', 'indusind_aura_edge', 'indusind', '/cards/indusind_aura_edge.svg'),
  ('INDUSIND', 'IndusInd Bank Platinum Aura', 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900', 'indusind_platinum_aura', 'indusind', '/cards/indusind_platinum_aura.svg'),
  ('INDUSIND', 'IndusInd Bank Iconia', 'bg-gradient-to-br from-slate-600 to-slate-800 text-blue-100', 'indusind_iconia', 'indusind', '/cards/indusind_iconia.svg'),
  ('INDUSIND', 'IndusInd Bank Nexxt', 'bg-gradient-to-br from-zinc-800 to-black text-cyan-400', 'indusind_nexxt', 'indusind', '/cards/indusind_nexxt.svg'),
  ('INDUSIND', 'EazyDiner IndusInd Bank', 'bg-gradient-to-br from-amber-600 to-stone-900 text-amber-50', 'indusind_eazydiner', 'indusind', '/cards/indusind_eazydiner.svg'),
  ('INDUSIND', 'Club Vistara IndusInd Bank', 'bg-gradient-to-br from-violet-800 to-violet-950 text-yellow-500', 'indusind_club_vistara', 'indusind', '/cards/indusind_club_vistara.svg'),
  ('INDUSIND', 'IndusInd Bank Tiger', 'bg-gradient-to-br from-orange-600 to-orange-900 text-orange-50', 'indusind_tiger', 'indusind', '/cards/indusind_tiger.svg'),
  ('INDUSIND', 'IndusInd Bank Crest', 'bg-gradient-to-br from-slate-800 to-slate-950 text-yellow-400', 'indusind_crest', 'indusind', '/cards/indusind_crest.svg'),
  ('PNB', 'PNB RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-100', 'pnb_rupay_select', 'pnb', '/cards/pnb_rupay_select.svg'),
  ('PNB', 'PNB RuPay Platinum', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100', 'pnb_rupay_platinum', 'pnb', '/cards/pnb_rupay_platinum.svg'),
  ('PNB', 'PNB Visa Signature', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-50', 'pnb_visa_signature', 'pnb', '/cards/pnb_visa_signature.svg'),
  ('PNB', 'PNB Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'pnb_visa_platinum', 'pnb', '/cards/pnb_visa_platinum.svg'),
  ('PNB', 'PNB RuPay Millennial', 'bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50', 'pnb_rupay_millennial', 'pnb', '/cards/pnb_rupay_millennial.svg'),
  ('PNB', 'PNB Wave', 'bg-gradient-to-br from-cyan-600 to-blue-800 text-cyan-50', 'pnb_wave', 'pnb', '/cards/pnb_wave.svg'),
  ('PNB', 'PNB Rakshak RuPay Select', 'bg-gradient-to-br from-lime-700 to-green-900 text-lime-50', 'pnb_rakshak', 'pnb', '/cards/pnb_rakshak.svg'),
  ('PNB', 'PNB Patanjali RuPay Platinum', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'pnb_patanjali_platinum', 'pnb', '/cards/pnb_patanjali_platinum.svg'),
  ('PNB', 'PNB Global Gold', 'bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-50', 'pnb_global_gold', 'pnb', '/cards/pnb_global_gold.svg'),
  ('PNB', 'PNB Global Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'pnb_global_classic', 'pnb', '/cards/pnb_global_classic.svg'),
  ('BOB', 'BOB Eterna', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'bob_eterna', 'bob', '/cards/bob_eterna.svg'),
  ('BOB', 'BOB Premier', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'bob_premier', 'bob', '/cards/bob_premier.svg'),
  ('BOB', 'BOB Select', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'bob_select', 'bob', '/cards/bob_select.svg'),
  ('BOB', 'BOB Easy', 'bg-gradient-to-br from-amber-500 to-orange-600 text-amber-50', 'bob_easy', 'bob', '/cards/bob_easy.svg'),
  ('BOB', 'BOB HPCL Energie', 'bg-gradient-to-br from-red-600 to-blue-800 text-red-50', 'bob_hpcl_energie', 'bob', '/cards/bob_hpcl_energie.svg'),
  ('BOB', 'BOB IRCTC', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'bob_irctc', 'bob', '/cards/bob_irctc.svg'),
  ('BOB', 'BOB Snapdeal', 'bg-gradient-to-br from-rose-600 to-red-800 text-rose-50', 'bob_snapdeal', 'bob', '/cards/bob_snapdeal.svg'),
  ('BOB', 'BOB Yoddha', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'bob_yoddha', 'bob', '/cards/bob_yoddha.svg'),
  ('BOB', 'BOB Varunah Plus', 'bg-gradient-to-br from-slate-800 to-blue-950 text-blue-100', 'bob_varunah', 'bob', '/cards/bob_varunah.svg'),
  ('BOB', 'BOB Pragati', 'bg-gradient-to-br from-emerald-600 to-green-800 text-emerald-50', 'bob_pragati', 'bob', '/cards/bob_pragati.svg'),
  ('CANARA', 'Canara Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'canara_visa_signature', 'canara', '/cards/canara_visa_signature.svg'),
  ('CANARA', 'Canara RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'canara_rupay_select', 'canara', '/cards/canara_rupay_select.svg'),
  ('CANARA', 'Canara Mastercard World', 'bg-gradient-to-br from-zinc-800 to-black text-zinc-300', 'canara_mastercard_world', 'canara', '/cards/canara_mastercard_world.svg'),
  ('CANARA', 'Canara Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'canara_visa_platinum', 'canara', '/cards/canara_visa_platinum.svg'),
  ('CANARA', 'Canara RuPay Platinum', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'canara_rupay_platinum', 'canara', '/cards/canara_rupay_platinum.svg'),
  ('CANARA', 'Canara Mastercard Platinum', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'canara_mastercard_platinum', 'canara', '/cards/canara_mastercard_platinum.svg'),
  ('CANARA', 'Canara Visa Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'canara_visa_classic', 'canara', '/cards/canara_visa_classic.svg'),
  ('CANARA', 'Canara RuPay Classic', 'bg-gradient-to-br from-emerald-600 to-teal-800 text-emerald-50', 'canara_rupay_classic', 'canara', '/cards/canara_rupay_classic.svg'),
  ('CANARA', 'Canara Mastercard Classic', 'bg-gradient-to-br from-sky-500 to-blue-700 text-sky-50', 'canara_mastercard_classic', 'canara', '/cards/canara_mastercard_classic.svg'),
  ('CANARA', 'Canara Corporate', 'bg-gradient-to-br from-blue-800 to-slate-900 text-yellow-500', 'canara_corporate', 'canara', '/cards/canara_corporate.svg'),
  ('UNION', 'Union Bank Uni Carbon', 'bg-gradient-to-br from-gray-700 to-green-900 text-green-100', 'union_uni_carbon', 'union', '/cards/union_uni_carbon.svg'),
  ('UNION', 'Union Bank Signature', 'bg-gradient-to-br from-blue-900 to-slate-900 text-yellow-500', 'union_signature', 'union', '/cards/union_signature.svg'),
  ('UNION', 'Union Bank RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'union_rupay_select', 'union', '/cards/union_rupay_select.svg'),
  ('UNION', 'Union Bank JCB Premier', 'bg-gradient-to-br from-red-700 to-red-950 text-yellow-500', 'union_jcb_premier', 'union', '/cards/union_jcb_premier.svg'),
  ('UNION', 'Union Bank Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'union_platinum', 'union', '/cards/union_platinum.svg'),
  ('UNION', 'Union Bank RuPay Platinum', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'union_rupay_platinum', 'union', '/cards/union_rupay_platinum.svg'),
  ('UNION', 'Union Bank Usecure', 'bg-gradient-to-br from-sky-500 to-sky-700 text-sky-50', 'union_usecure', 'union', '/cards/union_usecure.svg'),
  ('UNION', 'Union Bank Gold', 'bg-gradient-to-br from-yellow-500 to-amber-700 text-amber-50', 'union_gold', 'union', '/cards/union_gold.svg'),
  ('UNION', 'Union Bank Disha', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'union_disha', 'union', '/cards/union_disha.svg'),
  ('UNION', 'Union Bank Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'union_classic', 'union', '/cards/union_classic.svg'),
  ('BOI', 'BOI Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'boi_visa_signature', 'boi', '/cards/boi_visa_signature.svg'),
  ('BOI', 'BOI RuPay Select', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'boi_rupay_select', 'boi', '/cards/boi_rupay_select.svg'),
  ('BOI', 'BOI Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'boi_visa_platinum', 'boi', '/cards/boi_visa_platinum.svg'),
  ('BOI', 'BOI RuPay Platinum', 'bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100', 'boi_rupay_platinum', 'boi', '/cards/boi_rupay_platinum.svg'),
  ('BOI', 'BOI Mastercard Platinum', 'bg-gradient-to-br from-gray-600 to-gray-800 text-gray-100', 'boi_mastercard_platinum', 'boi', '/cards/boi_mastercard_platinum.svg'),
  ('BOI', 'BOI SwaDhaan RuPay', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'boi_swadhaan', 'boi', '/cards/boi_swadhaan.svg'),
  ('BOI', 'BOI India Card', 'bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800', 'boi_india_card', 'boi', '/cards/boi_india_card.svg'),
  ('BOI', 'BOI Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'boi_visa_gold', 'boi', '/cards/boi_visa_gold.svg'),
  ('BOI', 'BOI RuPay Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'boi_rupay_classic', 'boi', '/cards/boi_rupay_classic.svg'),
  ('BOI', 'BOI SME Card', 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50', 'boi_sme', 'boi', '/cards/boi_sme.svg'),
  ('IDBI', 'IDBI Euphoria', 'bg-gradient-to-br from-purple-800 to-indigo-950 text-purple-100', 'idbi_euphoria', 'idbi', '/cards/idbi_euphoria.svg'),
  ('IDBI', 'IDBI Aspire', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'idbi_aspire', 'idbi', '/cards/idbi_aspire.svg'),
  ('IDBI', 'IDBI Imperium', 'bg-gradient-to-br from-amber-600 to-yellow-800 text-amber-50', 'idbi_imperium', 'idbi', '/cards/idbi_imperium.svg'),
  ('IDBI', 'IDBI Winnings RuPay Select', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'idbi_winnings', 'idbi', '/cards/idbi_winnings.svg'),
  ('IDBI', 'LIC IDBI Signature', 'bg-gradient-to-br from-blue-800 to-blue-950 text-yellow-500', 'idbi_lic_signature', 'idbi', '/cards/idbi_lic_signature.svg'),
  ('IDBI', 'LIC IDBI Platinum', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'idbi_lic_platinum', 'idbi', '/cards/idbi_lic_platinum.svg'),
  ('IDBI', 'LIC IDBI Titanium', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-200', 'idbi_lic_titanium', 'idbi', '/cards/idbi_lic_titanium.svg'),
  ('IDBI', 'LIC IDBI Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'idbi_lic_classic', 'idbi', '/cards/idbi_lic_classic.svg'),
  ('IDBI', 'IDBI RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'idbi_rupay_select', 'idbi', '/cards/idbi_rupay_select.svg'),
  ('IDBI', 'IDBI RuPay Platinum', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'idbi_rupay_platinum', 'idbi', '/cards/idbi_rupay_platinum.svg'),
  ('YES', 'YES Marquee', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'yes_marquee', 'yes', '/cards/yes_marquee.svg'),
  ('YES', 'YES Reserv', 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900', 'yes_reserv', 'yes', '/cards/yes_reserv.svg'),
  ('YES', 'YES First Exclusive', 'bg-gradient-to-br from-blue-900 to-slate-900 text-slate-200', 'yes_first_exclusive', 'yes', '/cards/yes_first_exclusive.svg'),
  ('YES', 'YES First Preferred', 'bg-gradient-to-br from-yellow-800 to-yellow-950 text-yellow-100', 'yes_first_preferred', 'yes', '/cards/yes_first_preferred.svg'),
  ('YES', 'YES Premia', 'bg-gradient-to-br from-teal-600 to-teal-800 text-teal-50', 'yes_premia', 'yes', '/cards/yes_premia.svg'),
  ('YES', 'YES Prosperity Rewards Plus', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'yes_prosperity_rewards_plus', 'yes', '/cards/yes_prosperity_rewards_plus.svg'),
  ('YES', 'YES Prosperity Edge', 'bg-gradient-to-br from-rose-800 to-rose-950 text-rose-100', 'yes_prosperity_edge', 'yes', '/cards/yes_prosperity_edge.svg'),
  ('YES', 'FinBooster YES Bank', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'yes_finbooster', 'yes', '/cards/yes_finbooster.svg'),
  ('YES', 'YES BYOC', 'bg-gradient-to-br from-zinc-800 to-black text-cyan-400', 'yes_byoc', 'yes', '/cards/yes_byoc.svg'),
  ('YES', 'YES Wellness Plus', 'bg-gradient-to-br from-pink-700 to-pink-900 text-pink-50', 'yes_wellness_plus', 'yes', '/cards/yes_wellness_plus.svg'),
  ('RBL', 'RBL Bank Icon', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 'rbl_icon', 'rbl', '/cards/rbl_icon.svg'),
  ('RBL', 'RBL Bank World Safari', 'bg-gradient-to-br from-amber-800 to-stone-900 text-amber-100', 'rbl_world_safari', 'rbl', '/cards/rbl_world_safari.svg'),
  ('RBL', 'RBL Bank Platinum Maxima', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'rbl_platinum_maxima', 'rbl', '/cards/rbl_platinum_maxima.svg'),
  ('RBL', 'Bajaj Finserv RBL Platinum', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'bajaj_rbl_platinum', 'rbl', '/cards/bajaj_rbl_platinum.svg'),
  ('RBL', 'Bajaj Finserv RBL Binge', 'bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50', 'bajaj_rbl_binge', 'rbl', '/cards/bajaj_rbl_binge.svg'),
  ('RBL', 'RBL Bank ShopRite', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'rbl_shoprite', 'rbl', '/cards/rbl_shoprite.svg'),
  ('RBL', 'RBL Bank Play', 'bg-gradient-to-br from-rose-600 to-red-800 text-rose-50', 'rbl_play', 'rbl', '/cards/rbl_play.svg'),
  ('RBL', 'LazyPay RBL Bank', 'bg-gradient-to-br from-yellow-500 to-amber-600 text-yellow-50', 'rbl_lazy_pay', 'rbl', '/cards/rbl_lazy_pay.svg'),
  ('RBL', 'RBL Bank Cookies', 'bg-gradient-to-br from-amber-600 to-orange-800 text-amber-50', 'rbl_cookies', 'rbl', '/cards/rbl_cookies.svg'),
  ('RBL', 'RBL Bank SaveMax', 'bg-gradient-to-br from-sky-500 to-cyan-700 text-sky-50', 'rbl_savemax', 'rbl', '/cards/rbl_savemax.svg'),
  ('HSBC', 'HSBC Live+', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-cyan-50', 'hsbc_live_plus', 'hsbc', '/cards/hsbc_live_plus.svg'),
  ('HSBC', 'HSBC Premier', 'bg-gradient-to-br from-gray-800 to-black text-slate-200', 'hsbc_premier', 'hsbc', '/cards/hsbc_premier.svg'),
  ('HSBC', 'HSBC Star Alliance', 'bg-gradient-to-br from-black to-zinc-900 text-slate-100', 'hsbc_star_alliance', 'hsbc', '/cards/hsbc_star_alliance.svg'),
  ('HSBC', 'HSBC Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'hsbc_visa_platinum', 'hsbc', '/cards/hsbc_visa_platinum.svg'),
  ('HSBC', 'HSBC Smart Value', 'bg-gradient-to-br from-red-600 to-red-800 text-red-50', 'hsbc_smart_value', 'hsbc', '/cards/hsbc_smart_value.svg'),
  ('HSBC', 'HSBC Cashback', 'bg-gradient-to-br from-amber-500 to-orange-600 text-amber-50', 'hsbc_cashback', 'hsbc', '/cards/hsbc_cashback.svg'),
  ('HSBC', 'HSBC Premier Metal', 'bg-gradient-to-br from-slate-700 to-zinc-900 text-slate-300', 'hsbc_premier_metal', 'hsbc', '/cards/hsbc_premier_metal.svg'),
  ('HSBC', 'HSBC Corporate', 'bg-gradient-to-br from-blue-800 to-slate-900 text-blue-50', 'hsbc_corporate', 'hsbc', '/cards/hsbc_corporate.svg'),
  ('HSBC', 'HSBC Taj Epicure', 'bg-gradient-to-br from-yellow-700 to-amber-900 text-yellow-50', 'hsbc_taj_epicure', 'hsbc', '/cards/hsbc_taj_epicure.svg'),
  ('HSBC', 'HSBC Purchase Plus', 'bg-gradient-to-br from-blue-500 to-blue-800 text-blue-50', 'hsbc_purchase_plus', 'hsbc', '/cards/hsbc_purchase_plus.svg'),
  ('AMEX', 'American Express Platinum', 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900', 'amex_platinum', 'amex', '/cards/amex_platinum.svg'),
  ('AMEX', 'American Express Gold', 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950', 'amex_gold', 'amex', '/cards/amex_gold.svg'),
  ('AMEX', 'Amex Membership Rewards (MRCC)', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'amex_mrcc', 'amex', '/cards/amex_mrcc.svg'),
  ('AMEX', 'Amex SmartEarn', 'bg-gradient-to-br from-blue-600 to-blue-900 text-blue-50', 'amex_smartearn', 'amex', '/cards/amex_smartearn.svg'),
  ('AMEX', 'Amex Platinum Travel', 'bg-gradient-to-br from-sky-500 to-blue-700 text-sky-50', 'amex_platinum_travel', 'amex', '/cards/amex_platinum_travel.svg'),
  ('AMEX', 'Amex Platinum Reserve', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'amex_platinum_reserve', 'amex', '/cards/amex_platinum_reserve.svg'),
  ('AMEX', 'Amex Corporate Green', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'amex_corporate_green', 'amex', '/cards/amex_corporate_green.svg'),
  ('AMEX', 'Amex Corporate Gold', 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950', 'amex_corporate_gold', 'amex', '/cards/amex_corporate_gold.svg'),
  ('AMEX', 'Amex Corporate Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'amex_corporate_platinum', 'amex', '/cards/amex_corporate_platinum.svg'),
  ('AMEX', 'Amex Centurion Black', 'bg-gradient-to-br from-black to-zinc-900 text-zinc-300', 'amex_centurion', 'amex', '/cards/amex_centurion.svg'),
  ('SC', 'Standard Chartered Ultimate', 'bg-gradient-to-br from-black to-zinc-900 text-slate-200', 'sc_ultimate', 'sc', '/cards/sc_ultimate.svg'),
  ('SC', 'Standard Chartered Smart', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'sc_smart', 'sc', '/cards/sc_smart.svg'),
  ('SC', 'SC Platinum Rewards', 'bg-gradient-to-br from-blue-800 to-slate-900 text-blue-100', 'sc_platinum_rewards', 'sc', '/cards/sc_platinum_rewards.svg'),
  ('SC', 'SC Super Value Titanium', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'sc_super_value_titanium', 'sc', '/cards/sc_super_value_titanium.svg'),
  ('SC', 'EaseMyTrip Standard Chartered', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'sc_easemytrip', 'sc', '/cards/sc_easemytrip.svg'),
  ('SC', 'Standard Chartered Manhattan', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'sc_manhattan', 'sc', '/cards/sc_manhattan.svg'),
  ('SC', 'Standard Chartered DigiSmart', 'bg-gradient-to-br from-purple-600 to-purple-800 text-purple-50', 'sc_digismart', 'sc', '/cards/sc_digismart.svg'),
  ('SC', 'SC Priority Visa Infinite', 'bg-gradient-to-br from-slate-800 to-blue-950 text-yellow-500', 'sc_priority_infinite', 'sc', '/cards/sc_priority_infinite.svg'),
  ('SC', 'Standard Chartered Renown', 'bg-gradient-to-br from-red-800 to-red-950 text-red-50', 'sc_renown', 'sc', '/cards/sc_renown.svg'),
  ('SC', 'Standard Chartered Rewards', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'sc_rewards', 'sc', '/cards/sc_rewards.svg'),
  ('AU', 'AU Zenith', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'au_zenith', 'au', '/cards/au_zenith.svg'),
  ('AU', 'AU Zenith+', 'bg-gradient-to-br from-gray-800 to-black text-slate-300', 'au_zenith_plus', 'au', '/cards/au_zenith_plus.svg'),
  ('AU', 'AU Vetta', 'bg-gradient-to-br from-indigo-900 to-blue-950 text-indigo-100', 'au_vetta', 'au', '/cards/au_vetta.svg'),
  ('AU', 'AU Altura', 'bg-gradient-to-br from-teal-600 to-teal-800 text-teal-50', 'au_altura', 'au', '/cards/au_altura.svg'),
  ('AU', 'AU Altura+', 'bg-gradient-to-br from-rose-800 to-rose-950 text-rose-50', 'au_altura_plus', 'au', '/cards/au_altura_plus.svg'),
  ('AU', 'AU LIT (Live It Today)', 'bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-900', 'au_lit', 'au', '/cards/au_lit.svg'),
  ('AU', 'ixigo AU Credit Card', 'bg-gradient-to-br from-sky-500 to-sky-700 text-orange-400', 'au_ixigo', 'au', '/cards/au_ixigo.svg'),
  ('AU', 'AU SwipeUp', 'bg-gradient-to-br from-violet-600 to-violet-800 text-violet-50', 'au_swipeup', 'au', '/cards/au_swipeup.svg'),
  ('AU', 'AU Xcite', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-cyan-50', 'au_xcite', 'au', '/cards/au_xcite.svg'),
  ('AU', 'AU Xcite Ultra', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'au_xcite_ultra', 'au', '/cards/au_xcite_ultra.svg'),
  ('CENTRAL', 'Central Bank RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'cbi_rupay_select', 'central', '/cards/cbi_rupay_select.svg'),
  ('CENTRAL', 'Central Bank RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'cbi_rupay_platinum', 'central', '/cards/cbi_rupay_platinum.svg'),
  ('CENTRAL', 'Central Bank Visa Platinum', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'cbi_visa_platinum', 'central', '/cards/cbi_visa_platinum.svg'),
  ('CENTRAL', 'Central Bank Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'cbi_visa_gold', 'central', '/cards/cbi_visa_gold.svg'),
  ('CENTRAL', 'Central Bank Mastercard Titanium', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'cbi_mastercard_titanium', 'central', '/cards/cbi_mastercard_titanium.svg'),
  ('CENTRAL', 'Central Bank SBI Card ELITE', 'bg-gradient-to-br from-blue-900 to-black text-amber-400', 'cbi_sbi_elite', 'central', '/cards/cbi_sbi_elite.svg'),
  ('CENTRAL', 'Central Bank SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'cbi_sbi_prime', 'central', '/cards/cbi_sbi_prime.svg'),
  ('CENTRAL', 'CBI SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'cbi_simplysave_sbi', 'central', '/cards/cbi_simplysave_sbi.svg'),
  ('CENTRAL', 'CBI SimplyCLICK SBI Card', 'bg-gradient-to-br from-sky-600 to-blue-700 text-sky-50', 'cbi_simplyclick_sbi', 'central', '/cards/cbi_simplyclick_sbi.svg'),
  ('CENTRAL', 'Central Bank RuPay Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'cbi_rupay_classic', 'central', '/cards/cbi_rupay_classic.svg'),
  ('UCO', 'UCO Bank RuPay Select', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'uco_rupay_select', 'uco', '/cards/uco_rupay_select.svg'),
  ('UCO', 'UCO Bank RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'uco_rupay_platinum', 'uco', '/cards/uco_rupay_platinum.svg'),
  ('UCO', 'UCO Bank Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'uco_visa_signature', 'uco', '/cards/uco_visa_signature.svg'),
  ('UCO', 'UCO Bank Visa Platinum', 'bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100', 'uco_visa_platinum', 'uco', '/cards/uco_visa_platinum.svg'),
  ('UCO', 'UCO Bank Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'uco_visa_gold', 'uco', '/cards/uco_visa_gold.svg'),
  ('UCO', 'UCO Bank SBI Card ELITE', 'bg-gradient-to-br from-blue-900 to-slate-900 text-amber-400', 'uco_sbi_elite', 'uco', '/cards/uco_sbi_elite.svg'),
  ('UCO', 'UCO Bank SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'uco_sbi_prime', 'uco', '/cards/uco_sbi_prime.svg'),
  ('UCO', 'UCO SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'uco_simplysave_sbi', 'uco', '/cards/uco_simplysave_sbi.svg'),
  ('UCO', 'UCO Bank RuPay Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'uco_rupay_classic', 'uco', '/cards/uco_rupay_classic.svg'),
  ('UCO', 'UCO Bank Corporate Card', 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50', 'uco_corporate', 'uco', '/cards/uco_corporate.svg'),
  ('INDIAN', 'Indian Bank RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'indian_rupay_select', 'indian', '/cards/indian_rupay_select.svg'),
  ('INDIAN', 'Indian Bank Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'indian_visa_signature', 'indian', '/cards/indian_visa_signature.svg'),
  ('INDIAN', 'Indian Bank Mastercard World', 'bg-gradient-to-br from-zinc-800 to-black text-zinc-300', 'indian_mastercard_world', 'indian', '/cards/indian_mastercard_world.svg'),
  ('INDIAN', 'Indian Bank RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'indian_rupay_platinum', 'indian', '/cards/indian_rupay_platinum.svg'),
  ('INDIAN', 'Indian Bank Visa Platinum', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'indian_visa_platinum', 'indian', '/cards/indian_visa_platinum.svg'),
  ('INDIAN', 'Indian Bank Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'indian_visa_gold', 'indian', '/cards/indian_visa_gold.svg'),
  ('INDIAN', 'Indian Bank Mastercard Titanium', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'indian_mastercard_titanium', 'indian', '/cards/indian_mastercard_titanium.svg'),
  ('INDIAN', 'Indian Bank RuPay Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'indian_rupay_classic', 'indian', '/cards/indian_rupay_classic.svg'),
  ('INDIAN', 'Indian Bank Bharat Card', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'indian_bharat', 'indian', '/cards/indian_bharat.svg'),
  ('INDIAN', 'Indian Bank Corporate', 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50', 'indian_corporate', 'indian', '/cards/indian_corporate.svg'),
  ('BOM', 'Bank of Maharashtra RuPay Select', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'bom_rupay_select', 'bom', '/cards/bom_rupay_select.svg'),
  ('BOM', 'Bank of Maharashtra RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'bom_rupay_platinum', 'bom', '/cards/bom_rupay_platinum.svg'),
  ('BOM', 'Bank of Maharashtra Visa Platinum', 'bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100', 'bom_visa_platinum', 'bom', '/cards/bom_visa_platinum.svg'),
  ('BOM', 'Bank of Maharashtra Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'bom_visa_gold', 'bom', '/cards/bom_visa_gold.svg'),
  ('BOM', 'Bank of Maharashtra RuPay Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'bom_rupay_classic', 'bom', '/cards/bom_rupay_classic.svg'),
  ('BOM', 'MahaBank SBI Card ELITE', 'bg-gradient-to-br from-blue-900 to-black text-amber-400', 'bom_maha_sbi_elite', 'bom', '/cards/bom_maha_sbi_elite.svg'),
  ('BOM', 'MahaBank SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'bom_maha_sbi_prime', 'bom', '/cards/bom_maha_sbi_prime.svg'),
  ('BOM', 'MahaBank SBI Card Platinum', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-300', 'bom_maha_sbi_platinum', 'bom', '/cards/bom_maha_sbi_platinum.svg'),
  ('BOM', 'MahaBank SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'bom_simplysave_sbi', 'bom', '/cards/bom_simplysave_sbi.svg'),
  ('BOM', 'Bank of Maharashtra Corporate', 'bg-gradient-to-br from-emerald-600 to-teal-900 text-emerald-50', 'bom_corporate', 'bom', '/cards/bom_corporate.svg')
    ) as v(bank_name, card_name, style_classes, card_slug, bank_id, card_image_url)
    on conflict (card_slug) where (card_slug is not null) do update set
      bank_name = excluded.bank_name,
      card_name = excluded.card_name,
      style_classes = excluded.style_classes,
      bank_id = excluded.bank_id,
      card_image_url = excluded.card_image_url,
      is_active = true;
  else
    insert into public.card_catalog (card_id, bank_name, card_name, style_classes, card_slug, bank_id, card_image_url, is_active)
    select v.card_slug, v.bank_name, v.card_name, v.style_classes, v.card_slug, v.bank_id, v.card_image_url, true
    from (values
  ('HDFC', 'HDFC Infinia Metal', 'bg-gradient-to-br from-slate-900 to-black text-slate-200', 'hdfc_infinia', 'hdfc', '/cards/hdfc_infinia.svg'),
  ('HDFC', 'HDFC Diners Club Black', 'bg-gradient-to-br from-black to-zinc-900 text-zinc-300', 'hdfc_diners_black', 'hdfc', '/cards/hdfc_diners_black.svg'),
  ('HDFC', 'HDFC Regalia Gold', 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-yellow-50', 'hdfc_regalia_gold', 'hdfc', '/cards/hdfc_regalia_gold.svg'),
  ('HDFC', 'HDFC Millennia', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 'hdfc_millennia', 'hdfc', '/cards/hdfc_millennia.svg'),
  ('HDFC', 'Tata Neu Infinity HDFC', 'bg-gradient-to-br from-purple-900 to-violet-950 text-purple-100', 'hdfc_tata_neu_infinity', 'hdfc', '/cards/hdfc_tata_neu_infinity.svg'),
  ('HDFC', 'Tata Neu Plus HDFC', 'bg-gradient-to-br from-indigo-900 to-blue-950 text-indigo-100', 'hdfc_tata_neu_plus', 'hdfc', '/cards/hdfc_tata_neu_plus.svg'),
  ('HDFC', 'Swiggy HDFC', 'bg-gradient-to-br from-orange-500 to-black text-orange-50', 'hdfc_swiggy', 'hdfc', '/cards/hdfc_swiggy.svg'),
  ('HDFC', 'HDFC MoneyBack+', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100', 'hdfc_moneyback_plus', 'hdfc', '/cards/hdfc_moneyback_plus.svg'),
  ('HDFC', 'IndianOil HDFC', 'bg-gradient-to-br from-orange-600 to-orange-800 text-orange-50', 'hdfc_indianoil', 'hdfc', '/cards/hdfc_indianoil.svg'),
  ('HDFC', 'HDFC Freedom', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'hdfc_freedom', 'hdfc', '/cards/hdfc_freedom.svg'),
  ('ICICI', 'ICICI Emeralde Private', 'bg-gradient-to-br from-emerald-900 to-green-950 text-emerald-100', 'icici_emeralde_private', 'icici', '/cards/icici_emeralde_private.svg'),
  ('ICICI', 'ICICI Sapphiro', 'bg-gradient-to-br from-blue-800 to-indigo-950 text-blue-100', 'icici_sapphiro', 'icici', '/cards/icici_sapphiro.svg'),
  ('ICICI', 'ICICI Rubyx', 'bg-gradient-to-br from-rose-800 to-red-950 text-rose-100', 'icici_rubyx', 'icici', '/cards/icici_rubyx.svg'),
  ('ICICI', 'ICICI Coral', 'bg-gradient-to-br from-rose-500 to-pink-800 text-rose-50', 'icici_coral', 'icici', '/cards/icici_coral.svg'),
  ('ICICI', 'Amazon Pay ICICI', 'bg-gradient-to-br from-orange-600 to-red-900 text-orange-50', 'icici_amazon_pay', 'icici', '/cards/icici_amazon_pay.svg'),
  ('ICICI', 'MakeMyTrip ICICI Signature', 'bg-gradient-to-br from-zinc-900 to-black text-zinc-200', 'icici_mmt_signature', 'icici', '/cards/icici_mmt_signature.svg'),
  ('ICICI', 'MakeMyTrip ICICI Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'icici_mmt_platinum', 'icici', '/cards/icici_mmt_platinum.svg'),
  ('ICICI', 'Adani One ICICI Signature', 'bg-gradient-to-br from-black to-yellow-900 text-yellow-500', 'icici_adani_signature', 'icici', '/cards/icici_adani_signature.svg'),
  ('ICICI', 'ICICI HPCL Super Saver', 'bg-gradient-to-br from-red-600 to-blue-900 text-red-50', 'icici_hpcl_super_saver', 'icici', '/cards/icici_hpcl_super_saver.svg'),
  ('ICICI', 'ICICI Manchester United', 'bg-gradient-to-br from-red-700 to-red-900 text-red-50', 'icici_man_utd', 'icici', '/cards/icici_man_utd.svg'),
  ('SBI', 'SBI Card Aurum', 'bg-gradient-to-br from-black to-zinc-800 text-amber-500', 'sbi_aurum', 'sbi', '/cards/sbi_aurum.svg'),
  ('SBI', 'SBI Card Elite', 'bg-gradient-to-br from-blue-900 to-slate-900 text-amber-400', 'sbi_elite', 'sbi', '/cards/sbi_elite.svg'),
  ('SBI', 'Cashback SBI Card', 'bg-gradient-to-br from-cyan-600 to-blue-900 text-cyan-50', 'sbi_cashback', 'sbi', '/cards/sbi_cashback.svg'),
  ('SBI', 'SimplyCLICK SBI Card', 'bg-gradient-to-br from-sky-600 to-blue-700 text-sky-50', 'sbi_simplyclick', 'sbi', '/cards/sbi_simplyclick.svg'),
  ('SBI', 'SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'sbi_simplysave', 'sbi', '/cards/sbi_simplysave.svg'),
  ('SBI', 'SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'sbi_prime', 'sbi', '/cards/sbi_prime.svg'),
  ('SBI', 'SBI Card PULSE', 'bg-gradient-to-br from-purple-800 to-fuchsia-950 text-purple-100', 'sbi_pulse', 'sbi', '/cards/sbi_pulse.svg'),
  ('SBI', 'BPCL SBI Card OCTANE', 'bg-gradient-to-br from-slate-700 to-slate-900 text-green-400', 'sbi_bpcl_octane', 'sbi', '/cards/sbi_bpcl_octane.svg'),
  ('SBI', 'Club Vistara SBI Card PRIME', 'bg-gradient-to-br from-indigo-900 to-violet-950 text-amber-500', 'sbi_club_vistara_prime', 'sbi', '/cards/sbi_club_vistara_prime.svg'),
  ('SBI', 'Reliance SBI Card PRIME', 'bg-gradient-to-br from-red-600 to-red-900 text-red-50', 'sbi_reliance_prime', 'sbi', '/cards/sbi_reliance_prime.svg'),
  ('AXIS', 'Axis Bank Reserve', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'axis_reserve', 'axis', '/cards/axis_reserve.svg'),
  ('AXIS', 'Axis Bank Magnus', 'bg-gradient-to-br from-red-900 to-rose-950 text-red-100', 'axis_magnus', 'axis', '/cards/axis_magnus.svg'),
  ('AXIS', 'Axis Bank ATLAS', 'bg-gradient-to-br from-slate-500 to-slate-800 text-slate-100', 'axis_atlas', 'axis', '/cards/axis_atlas.svg'),
  ('AXIS', 'Flipkart Axis Bank', 'bg-gradient-to-br from-blue-600 to-blue-800 text-yellow-400', 'axis_flipkart', 'axis', '/cards/axis_flipkart.svg'),
  ('AXIS', 'Axis Bank ACE', 'bg-gradient-to-br from-teal-500 to-teal-800 text-teal-50', 'axis_ace', 'axis', '/cards/axis_ace.svg'),
  ('AXIS', 'Airtel Axis Bank', 'bg-gradient-to-br from-rose-600 to-black text-rose-50', 'axis_airtel', 'axis', '/cards/axis_airtel.svg'),
  ('AXIS', 'Axis Bank Neo', 'bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50', 'axis_neo', 'axis', '/cards/axis_neo.svg'),
  ('AXIS', 'Axis Bank MY ZONE', 'bg-gradient-to-br from-gray-700 to-black text-red-500', 'axis_my_zone', 'axis', '/cards/axis_my_zone.svg'),
  ('AXIS', 'Axis Bank Vistara Infinite', 'bg-gradient-to-br from-violet-800 to-violet-950 text-yellow-500', 'axis_vistara_infinite', 'axis', '/cards/axis_vistara_infinite.svg'),
  ('AXIS', 'Axis Bank SELECT', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'axis_select', 'axis', '/cards/axis_select.svg'),
  ('KOTAK', 'Kotak White Reserve', 'bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800', 'kotak_white_reserve', 'kotak', '/cards/kotak_white_reserve.svg'),
  ('KOTAK', 'Kotak Zen Signature', 'bg-gradient-to-br from-gray-700 to-gray-900 text-gray-100', 'kotak_zen_signature', 'kotak', '/cards/kotak_zen_signature.svg'),
  ('KOTAK', 'Kotak Privy League Signature', 'bg-gradient-to-br from-blue-900 to-indigo-950 text-yellow-500', 'kotak_privy_league', 'kotak', '/cards/kotak_privy_league.svg'),
  ('KOTAK', 'Kotak Royale Signature', 'bg-gradient-to-br from-blue-700 to-blue-900 text-yellow-400', 'kotak_royale_signature', 'kotak', '/cards/kotak_royale_signature.svg'),
  ('KOTAK', 'Kotak League Platinum', 'bg-gradient-to-br from-red-600 to-red-800 text-red-50', 'kotak_league_platinum', 'kotak', '/cards/kotak_league_platinum.svg'),
  ('KOTAK', 'Kotak Mojo Platinum', 'bg-gradient-to-br from-black to-zinc-800 text-yellow-500', 'kotak_mojo_platinum', 'kotak', '/cards/kotak_mojo_platinum.svg'),
  ('KOTAK', 'Kotak 811 #DreamDifferent', 'bg-gradient-to-br from-red-700 to-red-900 text-white', 'kotak_811', 'kotak', '/cards/kotak_811.svg'),
  ('KOTAK', 'Kotak PVR Platinum', 'bg-gradient-to-br from-gray-800 to-black text-yellow-500', 'kotak_pvr_platinum', 'kotak', '/cards/kotak_pvr_platinum.svg'),
  ('KOTAK', 'IndianOil Kotak', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'kotak_indianoil', 'kotak', '/cards/kotak_indianoil.svg'),
  ('KOTAK', 'Kotak Myntra', 'bg-gradient-to-br from-pink-600 to-purple-700 text-pink-50', 'kotak_myntra', 'kotak', '/cards/kotak_myntra.svg'),
  ('IDFC', 'FIRST Private', 'bg-gradient-to-br from-black to-zinc-900 text-zinc-300', 'idfc_private', 'idfc', '/cards/idfc_private.svg'),
  ('IDFC', 'FIRST Mayura', 'bg-gradient-to-br from-teal-700 to-teal-950 text-amber-400', 'idfc_mayura', 'idfc', '/cards/idfc_mayura.svg'),
  ('IDFC', 'FIRST Ashva', 'bg-gradient-to-br from-amber-800 to-amber-950 text-amber-200', 'idfc_ashva', 'idfc', '/cards/idfc_ashva.svg'),
  ('IDFC', 'FIRST Wealth', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 'idfc_wealth', 'idfc', '/cards/idfc_wealth.svg'),
  ('IDFC', 'FIRST Select', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'idfc_select', 'idfc', '/cards/idfc_select.svg'),
  ('IDFC', 'FIRST Millennia', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'idfc_millennia', 'idfc', '/cards/idfc_millennia.svg'),
  ('IDFC', 'FIRST Classic', 'bg-gradient-to-br from-red-800 to-red-950 text-red-50', 'idfc_classic', 'idfc', '/cards/idfc_classic.svg'),
  ('IDFC', 'FIRST WOW!', 'bg-gradient-to-br from-gray-600 to-gray-800 text-gray-100', 'idfc_wow', 'idfc', '/cards/idfc_wow.svg'),
  ('IDFC', 'FIRST Power+', 'bg-gradient-to-br from-red-700 to-red-900 text-red-50', 'idfc_power_plus', 'idfc', '/cards/idfc_power_plus.svg'),
  ('IDFC', 'IndiGo IDFC FIRST', 'bg-gradient-to-br from-indigo-600 to-indigo-900 text-indigo-50', 'idfc_indigo', 'idfc', '/cards/idfc_indigo.svg'),
  ('INDUSIND', 'IndusInd Bank Legend', 'bg-gradient-to-br from-red-900 to-orange-950 text-red-100', 'indusind_legend', 'indusind', '/cards/indusind_legend.svg'),
  ('INDUSIND', 'IndusInd Bank Pinnacle', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'indusind_pinnacle', 'indusind', '/cards/indusind_pinnacle.svg'),
  ('INDUSIND', 'IndusInd Bank Aura Edge', 'bg-gradient-to-br from-blue-900 to-slate-900 text-slate-200', 'indusind_aura_edge', 'indusind', '/cards/indusind_aura_edge.svg'),
  ('INDUSIND', 'IndusInd Bank Platinum Aura', 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900', 'indusind_platinum_aura', 'indusind', '/cards/indusind_platinum_aura.svg'),
  ('INDUSIND', 'IndusInd Bank Iconia', 'bg-gradient-to-br from-slate-600 to-slate-800 text-blue-100', 'indusind_iconia', 'indusind', '/cards/indusind_iconia.svg'),
  ('INDUSIND', 'IndusInd Bank Nexxt', 'bg-gradient-to-br from-zinc-800 to-black text-cyan-400', 'indusind_nexxt', 'indusind', '/cards/indusind_nexxt.svg'),
  ('INDUSIND', 'EazyDiner IndusInd Bank', 'bg-gradient-to-br from-amber-600 to-stone-900 text-amber-50', 'indusind_eazydiner', 'indusind', '/cards/indusind_eazydiner.svg'),
  ('INDUSIND', 'Club Vistara IndusInd Bank', 'bg-gradient-to-br from-violet-800 to-violet-950 text-yellow-500', 'indusind_club_vistara', 'indusind', '/cards/indusind_club_vistara.svg'),
  ('INDUSIND', 'IndusInd Bank Tiger', 'bg-gradient-to-br from-orange-600 to-orange-900 text-orange-50', 'indusind_tiger', 'indusind', '/cards/indusind_tiger.svg'),
  ('INDUSIND', 'IndusInd Bank Crest', 'bg-gradient-to-br from-slate-800 to-slate-950 text-yellow-400', 'indusind_crest', 'indusind', '/cards/indusind_crest.svg'),
  ('PNB', 'PNB RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-100', 'pnb_rupay_select', 'pnb', '/cards/pnb_rupay_select.svg'),
  ('PNB', 'PNB RuPay Platinum', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100', 'pnb_rupay_platinum', 'pnb', '/cards/pnb_rupay_platinum.svg'),
  ('PNB', 'PNB Visa Signature', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-50', 'pnb_visa_signature', 'pnb', '/cards/pnb_visa_signature.svg'),
  ('PNB', 'PNB Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'pnb_visa_platinum', 'pnb', '/cards/pnb_visa_platinum.svg'),
  ('PNB', 'PNB RuPay Millennial', 'bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50', 'pnb_rupay_millennial', 'pnb', '/cards/pnb_rupay_millennial.svg'),
  ('PNB', 'PNB Wave', 'bg-gradient-to-br from-cyan-600 to-blue-800 text-cyan-50', 'pnb_wave', 'pnb', '/cards/pnb_wave.svg'),
  ('PNB', 'PNB Rakshak RuPay Select', 'bg-gradient-to-br from-lime-700 to-green-900 text-lime-50', 'pnb_rakshak', 'pnb', '/cards/pnb_rakshak.svg'),
  ('PNB', 'PNB Patanjali RuPay Platinum', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'pnb_patanjali_platinum', 'pnb', '/cards/pnb_patanjali_platinum.svg'),
  ('PNB', 'PNB Global Gold', 'bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-50', 'pnb_global_gold', 'pnb', '/cards/pnb_global_gold.svg'),
  ('PNB', 'PNB Global Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'pnb_global_classic', 'pnb', '/cards/pnb_global_classic.svg'),
  ('BOB', 'BOB Eterna', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'bob_eterna', 'bob', '/cards/bob_eterna.svg'),
  ('BOB', 'BOB Premier', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'bob_premier', 'bob', '/cards/bob_premier.svg'),
  ('BOB', 'BOB Select', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'bob_select', 'bob', '/cards/bob_select.svg'),
  ('BOB', 'BOB Easy', 'bg-gradient-to-br from-amber-500 to-orange-600 text-amber-50', 'bob_easy', 'bob', '/cards/bob_easy.svg'),
  ('BOB', 'BOB HPCL Energie', 'bg-gradient-to-br from-red-600 to-blue-800 text-red-50', 'bob_hpcl_energie', 'bob', '/cards/bob_hpcl_energie.svg'),
  ('BOB', 'BOB IRCTC', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'bob_irctc', 'bob', '/cards/bob_irctc.svg'),
  ('BOB', 'BOB Snapdeal', 'bg-gradient-to-br from-rose-600 to-red-800 text-rose-50', 'bob_snapdeal', 'bob', '/cards/bob_snapdeal.svg'),
  ('BOB', 'BOB Yoddha', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'bob_yoddha', 'bob', '/cards/bob_yoddha.svg'),
  ('BOB', 'BOB Varunah Plus', 'bg-gradient-to-br from-slate-800 to-blue-950 text-blue-100', 'bob_varunah', 'bob', '/cards/bob_varunah.svg'),
  ('BOB', 'BOB Pragati', 'bg-gradient-to-br from-emerald-600 to-green-800 text-emerald-50', 'bob_pragati', 'bob', '/cards/bob_pragati.svg'),
  ('CANARA', 'Canara Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'canara_visa_signature', 'canara', '/cards/canara_visa_signature.svg'),
  ('CANARA', 'Canara RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'canara_rupay_select', 'canara', '/cards/canara_rupay_select.svg'),
  ('CANARA', 'Canara Mastercard World', 'bg-gradient-to-br from-zinc-800 to-black text-zinc-300', 'canara_mastercard_world', 'canara', '/cards/canara_mastercard_world.svg'),
  ('CANARA', 'Canara Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'canara_visa_platinum', 'canara', '/cards/canara_visa_platinum.svg'),
  ('CANARA', 'Canara RuPay Platinum', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'canara_rupay_platinum', 'canara', '/cards/canara_rupay_platinum.svg'),
  ('CANARA', 'Canara Mastercard Platinum', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'canara_mastercard_platinum', 'canara', '/cards/canara_mastercard_platinum.svg'),
  ('CANARA', 'Canara Visa Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'canara_visa_classic', 'canara', '/cards/canara_visa_classic.svg'),
  ('CANARA', 'Canara RuPay Classic', 'bg-gradient-to-br from-emerald-600 to-teal-800 text-emerald-50', 'canara_rupay_classic', 'canara', '/cards/canara_rupay_classic.svg'),
  ('CANARA', 'Canara Mastercard Classic', 'bg-gradient-to-br from-sky-500 to-blue-700 text-sky-50', 'canara_mastercard_classic', 'canara', '/cards/canara_mastercard_classic.svg'),
  ('CANARA', 'Canara Corporate', 'bg-gradient-to-br from-blue-800 to-slate-900 text-yellow-500', 'canara_corporate', 'canara', '/cards/canara_corporate.svg'),
  ('UNION', 'Union Bank Uni Carbon', 'bg-gradient-to-br from-gray-700 to-green-900 text-green-100', 'union_uni_carbon', 'union', '/cards/union_uni_carbon.svg'),
  ('UNION', 'Union Bank Signature', 'bg-gradient-to-br from-blue-900 to-slate-900 text-yellow-500', 'union_signature', 'union', '/cards/union_signature.svg'),
  ('UNION', 'Union Bank RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'union_rupay_select', 'union', '/cards/union_rupay_select.svg'),
  ('UNION', 'Union Bank JCB Premier', 'bg-gradient-to-br from-red-700 to-red-950 text-yellow-500', 'union_jcb_premier', 'union', '/cards/union_jcb_premier.svg'),
  ('UNION', 'Union Bank Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'union_platinum', 'union', '/cards/union_platinum.svg'),
  ('UNION', 'Union Bank RuPay Platinum', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'union_rupay_platinum', 'union', '/cards/union_rupay_platinum.svg'),
  ('UNION', 'Union Bank Usecure', 'bg-gradient-to-br from-sky-500 to-sky-700 text-sky-50', 'union_usecure', 'union', '/cards/union_usecure.svg'),
  ('UNION', 'Union Bank Gold', 'bg-gradient-to-br from-yellow-500 to-amber-700 text-amber-50', 'union_gold', 'union', '/cards/union_gold.svg'),
  ('UNION', 'Union Bank Disha', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'union_disha', 'union', '/cards/union_disha.svg'),
  ('UNION', 'Union Bank Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'union_classic', 'union', '/cards/union_classic.svg'),
  ('BOI', 'BOI Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'boi_visa_signature', 'boi', '/cards/boi_visa_signature.svg'),
  ('BOI', 'BOI RuPay Select', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'boi_rupay_select', 'boi', '/cards/boi_rupay_select.svg'),
  ('BOI', 'BOI Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'boi_visa_platinum', 'boi', '/cards/boi_visa_platinum.svg'),
  ('BOI', 'BOI RuPay Platinum', 'bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100', 'boi_rupay_platinum', 'boi', '/cards/boi_rupay_platinum.svg'),
  ('BOI', 'BOI Mastercard Platinum', 'bg-gradient-to-br from-gray-600 to-gray-800 text-gray-100', 'boi_mastercard_platinum', 'boi', '/cards/boi_mastercard_platinum.svg'),
  ('BOI', 'BOI SwaDhaan RuPay', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'boi_swadhaan', 'boi', '/cards/boi_swadhaan.svg'),
  ('BOI', 'BOI India Card', 'bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800', 'boi_india_card', 'boi', '/cards/boi_india_card.svg'),
  ('BOI', 'BOI Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'boi_visa_gold', 'boi', '/cards/boi_visa_gold.svg'),
  ('BOI', 'BOI RuPay Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'boi_rupay_classic', 'boi', '/cards/boi_rupay_classic.svg'),
  ('BOI', 'BOI SME Card', 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50', 'boi_sme', 'boi', '/cards/boi_sme.svg'),
  ('IDBI', 'IDBI Euphoria', 'bg-gradient-to-br from-purple-800 to-indigo-950 text-purple-100', 'idbi_euphoria', 'idbi', '/cards/idbi_euphoria.svg'),
  ('IDBI', 'IDBI Aspire', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'idbi_aspire', 'idbi', '/cards/idbi_aspire.svg'),
  ('IDBI', 'IDBI Imperium', 'bg-gradient-to-br from-amber-600 to-yellow-800 text-amber-50', 'idbi_imperium', 'idbi', '/cards/idbi_imperium.svg'),
  ('IDBI', 'IDBI Winnings RuPay Select', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'idbi_winnings', 'idbi', '/cards/idbi_winnings.svg'),
  ('IDBI', 'LIC IDBI Signature', 'bg-gradient-to-br from-blue-800 to-blue-950 text-yellow-500', 'idbi_lic_signature', 'idbi', '/cards/idbi_lic_signature.svg'),
  ('IDBI', 'LIC IDBI Platinum', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'idbi_lic_platinum', 'idbi', '/cards/idbi_lic_platinum.svg'),
  ('IDBI', 'LIC IDBI Titanium', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-200', 'idbi_lic_titanium', 'idbi', '/cards/idbi_lic_titanium.svg'),
  ('IDBI', 'LIC IDBI Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'idbi_lic_classic', 'idbi', '/cards/idbi_lic_classic.svg'),
  ('IDBI', 'IDBI RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'idbi_rupay_select', 'idbi', '/cards/idbi_rupay_select.svg'),
  ('IDBI', 'IDBI RuPay Platinum', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'idbi_rupay_platinum', 'idbi', '/cards/idbi_rupay_platinum.svg'),
  ('YES', 'YES Marquee', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'yes_marquee', 'yes', '/cards/yes_marquee.svg'),
  ('YES', 'YES Reserv', 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900', 'yes_reserv', 'yes', '/cards/yes_reserv.svg'),
  ('YES', 'YES First Exclusive', 'bg-gradient-to-br from-blue-900 to-slate-900 text-slate-200', 'yes_first_exclusive', 'yes', '/cards/yes_first_exclusive.svg'),
  ('YES', 'YES First Preferred', 'bg-gradient-to-br from-yellow-800 to-yellow-950 text-yellow-100', 'yes_first_preferred', 'yes', '/cards/yes_first_preferred.svg'),
  ('YES', 'YES Premia', 'bg-gradient-to-br from-teal-600 to-teal-800 text-teal-50', 'yes_premia', 'yes', '/cards/yes_premia.svg'),
  ('YES', 'YES Prosperity Rewards Plus', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'yes_prosperity_rewards_plus', 'yes', '/cards/yes_prosperity_rewards_plus.svg'),
  ('YES', 'YES Prosperity Edge', 'bg-gradient-to-br from-rose-800 to-rose-950 text-rose-100', 'yes_prosperity_edge', 'yes', '/cards/yes_prosperity_edge.svg'),
  ('YES', 'FinBooster YES Bank', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'yes_finbooster', 'yes', '/cards/yes_finbooster.svg'),
  ('YES', 'YES BYOC', 'bg-gradient-to-br from-zinc-800 to-black text-cyan-400', 'yes_byoc', 'yes', '/cards/yes_byoc.svg'),
  ('YES', 'YES Wellness Plus', 'bg-gradient-to-br from-pink-700 to-pink-900 text-pink-50', 'yes_wellness_plus', 'yes', '/cards/yes_wellness_plus.svg'),
  ('RBL', 'RBL Bank Icon', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 'rbl_icon', 'rbl', '/cards/rbl_icon.svg'),
  ('RBL', 'RBL Bank World Safari', 'bg-gradient-to-br from-amber-800 to-stone-900 text-amber-100', 'rbl_world_safari', 'rbl', '/cards/rbl_world_safari.svg'),
  ('RBL', 'RBL Bank Platinum Maxima', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'rbl_platinum_maxima', 'rbl', '/cards/rbl_platinum_maxima.svg'),
  ('RBL', 'Bajaj Finserv RBL Platinum', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'bajaj_rbl_platinum', 'rbl', '/cards/bajaj_rbl_platinum.svg'),
  ('RBL', 'Bajaj Finserv RBL Binge', 'bg-gradient-to-br from-indigo-600 to-purple-800 text-indigo-50', 'bajaj_rbl_binge', 'rbl', '/cards/bajaj_rbl_binge.svg'),
  ('RBL', 'RBL Bank ShopRite', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'rbl_shoprite', 'rbl', '/cards/rbl_shoprite.svg'),
  ('RBL', 'RBL Bank Play', 'bg-gradient-to-br from-rose-600 to-red-800 text-rose-50', 'rbl_play', 'rbl', '/cards/rbl_play.svg'),
  ('RBL', 'LazyPay RBL Bank', 'bg-gradient-to-br from-yellow-500 to-amber-600 text-yellow-50', 'rbl_lazy_pay', 'rbl', '/cards/rbl_lazy_pay.svg'),
  ('RBL', 'RBL Bank Cookies', 'bg-gradient-to-br from-amber-600 to-orange-800 text-amber-50', 'rbl_cookies', 'rbl', '/cards/rbl_cookies.svg'),
  ('RBL', 'RBL Bank SaveMax', 'bg-gradient-to-br from-sky-500 to-cyan-700 text-sky-50', 'rbl_savemax', 'rbl', '/cards/rbl_savemax.svg'),
  ('HSBC', 'HSBC Live+', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-cyan-50', 'hsbc_live_plus', 'hsbc', '/cards/hsbc_live_plus.svg'),
  ('HSBC', 'HSBC Premier', 'bg-gradient-to-br from-gray-800 to-black text-slate-200', 'hsbc_premier', 'hsbc', '/cards/hsbc_premier.svg'),
  ('HSBC', 'HSBC Star Alliance', 'bg-gradient-to-br from-black to-zinc-900 text-slate-100', 'hsbc_star_alliance', 'hsbc', '/cards/hsbc_star_alliance.svg'),
  ('HSBC', 'HSBC Visa Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'hsbc_visa_platinum', 'hsbc', '/cards/hsbc_visa_platinum.svg'),
  ('HSBC', 'HSBC Smart Value', 'bg-gradient-to-br from-red-600 to-red-800 text-red-50', 'hsbc_smart_value', 'hsbc', '/cards/hsbc_smart_value.svg'),
  ('HSBC', 'HSBC Cashback', 'bg-gradient-to-br from-amber-500 to-orange-600 text-amber-50', 'hsbc_cashback', 'hsbc', '/cards/hsbc_cashback.svg'),
  ('HSBC', 'HSBC Premier Metal', 'bg-gradient-to-br from-slate-700 to-zinc-900 text-slate-300', 'hsbc_premier_metal', 'hsbc', '/cards/hsbc_premier_metal.svg'),
  ('HSBC', 'HSBC Corporate', 'bg-gradient-to-br from-blue-800 to-slate-900 text-blue-50', 'hsbc_corporate', 'hsbc', '/cards/hsbc_corporate.svg'),
  ('HSBC', 'HSBC Taj Epicure', 'bg-gradient-to-br from-yellow-700 to-amber-900 text-yellow-50', 'hsbc_taj_epicure', 'hsbc', '/cards/hsbc_taj_epicure.svg'),
  ('HSBC', 'HSBC Purchase Plus', 'bg-gradient-to-br from-blue-500 to-blue-800 text-blue-50', 'hsbc_purchase_plus', 'hsbc', '/cards/hsbc_purchase_plus.svg'),
  ('AMEX', 'American Express Platinum', 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900', 'amex_platinum', 'amex', '/cards/amex_platinum.svg'),
  ('AMEX', 'American Express Gold', 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950', 'amex_gold', 'amex', '/cards/amex_gold.svg'),
  ('AMEX', 'Amex Membership Rewards (MRCC)', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'amex_mrcc', 'amex', '/cards/amex_mrcc.svg'),
  ('AMEX', 'Amex SmartEarn', 'bg-gradient-to-br from-blue-600 to-blue-900 text-blue-50', 'amex_smartearn', 'amex', '/cards/amex_smartearn.svg'),
  ('AMEX', 'Amex Platinum Travel', 'bg-gradient-to-br from-sky-500 to-blue-700 text-sky-50', 'amex_platinum_travel', 'amex', '/cards/amex_platinum_travel.svg'),
  ('AMEX', 'Amex Platinum Reserve', 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100', 'amex_platinum_reserve', 'amex', '/cards/amex_platinum_reserve.svg'),
  ('AMEX', 'Amex Corporate Green', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'amex_corporate_green', 'amex', '/cards/amex_corporate_green.svg'),
  ('AMEX', 'Amex Corporate Gold', 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950', 'amex_corporate_gold', 'amex', '/cards/amex_corporate_gold.svg'),
  ('AMEX', 'Amex Corporate Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'amex_corporate_platinum', 'amex', '/cards/amex_corporate_platinum.svg'),
  ('AMEX', 'Amex Centurion Black', 'bg-gradient-to-br from-black to-zinc-900 text-zinc-300', 'amex_centurion', 'amex', '/cards/amex_centurion.svg'),
  ('SC', 'Standard Chartered Ultimate', 'bg-gradient-to-br from-black to-zinc-900 text-slate-200', 'sc_ultimate', 'sc', '/cards/sc_ultimate.svg'),
  ('SC', 'Standard Chartered Smart', 'bg-gradient-to-br from-sky-600 to-blue-800 text-sky-50', 'sc_smart', 'sc', '/cards/sc_smart.svg'),
  ('SC', 'SC Platinum Rewards', 'bg-gradient-to-br from-blue-800 to-slate-900 text-blue-100', 'sc_platinum_rewards', 'sc', '/cards/sc_platinum_rewards.svg'),
  ('SC', 'SC Super Value Titanium', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'sc_super_value_titanium', 'sc', '/cards/sc_super_value_titanium.svg'),
  ('SC', 'EaseMyTrip Standard Chartered', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'sc_easemytrip', 'sc', '/cards/sc_easemytrip.svg'),
  ('SC', 'Standard Chartered Manhattan', 'bg-gradient-to-br from-green-600 to-green-800 text-green-50', 'sc_manhattan', 'sc', '/cards/sc_manhattan.svg'),
  ('SC', 'Standard Chartered DigiSmart', 'bg-gradient-to-br from-purple-600 to-purple-800 text-purple-50', 'sc_digismart', 'sc', '/cards/sc_digismart.svg'),
  ('SC', 'SC Priority Visa Infinite', 'bg-gradient-to-br from-slate-800 to-blue-950 text-yellow-500', 'sc_priority_infinite', 'sc', '/cards/sc_priority_infinite.svg'),
  ('SC', 'Standard Chartered Renown', 'bg-gradient-to-br from-red-800 to-red-950 text-red-50', 'sc_renown', 'sc', '/cards/sc_renown.svg'),
  ('SC', 'Standard Chartered Rewards', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'sc_rewards', 'sc', '/cards/sc_rewards.svg'),
  ('AU', 'AU Zenith', 'bg-gradient-to-br from-black to-zinc-900 text-yellow-500', 'au_zenith', 'au', '/cards/au_zenith.svg'),
  ('AU', 'AU Zenith+', 'bg-gradient-to-br from-gray-800 to-black text-slate-300', 'au_zenith_plus', 'au', '/cards/au_zenith_plus.svg'),
  ('AU', 'AU Vetta', 'bg-gradient-to-br from-indigo-900 to-blue-950 text-indigo-100', 'au_vetta', 'au', '/cards/au_vetta.svg'),
  ('AU', 'AU Altura', 'bg-gradient-to-br from-teal-600 to-teal-800 text-teal-50', 'au_altura', 'au', '/cards/au_altura.svg'),
  ('AU', 'AU Altura+', 'bg-gradient-to-br from-rose-800 to-rose-950 text-rose-50', 'au_altura_plus', 'au', '/cards/au_altura_plus.svg'),
  ('AU', 'AU LIT (Live It Today)', 'bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-900', 'au_lit', 'au', '/cards/au_lit.svg'),
  ('AU', 'ixigo AU Credit Card', 'bg-gradient-to-br from-sky-500 to-sky-700 text-orange-400', 'au_ixigo', 'au', '/cards/au_ixigo.svg'),
  ('AU', 'AU SwipeUp', 'bg-gradient-to-br from-violet-600 to-violet-800 text-violet-50', 'au_swipeup', 'au', '/cards/au_swipeup.svg'),
  ('AU', 'AU Xcite', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-cyan-50', 'au_xcite', 'au', '/cards/au_xcite.svg'),
  ('AU', 'AU Xcite Ultra', 'bg-gradient-to-br from-green-700 to-green-900 text-green-50', 'au_xcite_ultra', 'au', '/cards/au_xcite_ultra.svg'),
  ('CENTRAL', 'Central Bank RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'cbi_rupay_select', 'central', '/cards/cbi_rupay_select.svg'),
  ('CENTRAL', 'Central Bank RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'cbi_rupay_platinum', 'central', '/cards/cbi_rupay_platinum.svg'),
  ('CENTRAL', 'Central Bank Visa Platinum', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'cbi_visa_platinum', 'central', '/cards/cbi_visa_platinum.svg'),
  ('CENTRAL', 'Central Bank Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'cbi_visa_gold', 'central', '/cards/cbi_visa_gold.svg'),
  ('CENTRAL', 'Central Bank Mastercard Titanium', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'cbi_mastercard_titanium', 'central', '/cards/cbi_mastercard_titanium.svg'),
  ('CENTRAL', 'Central Bank SBI Card ELITE', 'bg-gradient-to-br from-blue-900 to-black text-amber-400', 'cbi_sbi_elite', 'central', '/cards/cbi_sbi_elite.svg'),
  ('CENTRAL', 'Central Bank SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'cbi_sbi_prime', 'central', '/cards/cbi_sbi_prime.svg'),
  ('CENTRAL', 'CBI SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'cbi_simplysave_sbi', 'central', '/cards/cbi_simplysave_sbi.svg'),
  ('CENTRAL', 'CBI SimplyCLICK SBI Card', 'bg-gradient-to-br from-sky-600 to-blue-700 text-sky-50', 'cbi_simplyclick_sbi', 'central', '/cards/cbi_simplyclick_sbi.svg'),
  ('CENTRAL', 'Central Bank RuPay Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'cbi_rupay_classic', 'central', '/cards/cbi_rupay_classic.svg'),
  ('UCO', 'UCO Bank RuPay Select', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'uco_rupay_select', 'uco', '/cards/uco_rupay_select.svg'),
  ('UCO', 'UCO Bank RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'uco_rupay_platinum', 'uco', '/cards/uco_rupay_platinum.svg'),
  ('UCO', 'UCO Bank Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'uco_visa_signature', 'uco', '/cards/uco_visa_signature.svg'),
  ('UCO', 'UCO Bank Visa Platinum', 'bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100', 'uco_visa_platinum', 'uco', '/cards/uco_visa_platinum.svg'),
  ('UCO', 'UCO Bank Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'uco_visa_gold', 'uco', '/cards/uco_visa_gold.svg'),
  ('UCO', 'UCO Bank SBI Card ELITE', 'bg-gradient-to-br from-blue-900 to-slate-900 text-amber-400', 'uco_sbi_elite', 'uco', '/cards/uco_sbi_elite.svg'),
  ('UCO', 'UCO Bank SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'uco_sbi_prime', 'uco', '/cards/uco_sbi_prime.svg'),
  ('UCO', 'UCO SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'uco_simplysave_sbi', 'uco', '/cards/uco_simplysave_sbi.svg'),
  ('UCO', 'UCO Bank RuPay Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'uco_rupay_classic', 'uco', '/cards/uco_rupay_classic.svg'),
  ('UCO', 'UCO Bank Corporate Card', 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50', 'uco_corporate', 'uco', '/cards/uco_corporate.svg'),
  ('INDIAN', 'Indian Bank RuPay Select', 'bg-gradient-to-br from-sky-700 to-blue-900 text-sky-50', 'indian_rupay_select', 'indian', '/cards/indian_rupay_select.svg'),
  ('INDIAN', 'Indian Bank Visa Signature', 'bg-gradient-to-br from-slate-800 to-black text-slate-200', 'indian_visa_signature', 'indian', '/cards/indian_visa_signature.svg'),
  ('INDIAN', 'Indian Bank Mastercard World', 'bg-gradient-to-br from-zinc-800 to-black text-zinc-300', 'indian_mastercard_world', 'indian', '/cards/indian_mastercard_world.svg'),
  ('INDIAN', 'Indian Bank RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'indian_rupay_platinum', 'indian', '/cards/indian_rupay_platinum.svg'),
  ('INDIAN', 'Indian Bank Visa Platinum', 'bg-gradient-to-br from-blue-700 to-blue-900 text-blue-50', 'indian_visa_platinum', 'indian', '/cards/indian_visa_platinum.svg'),
  ('INDIAN', 'Indian Bank Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'indian_visa_gold', 'indian', '/cards/indian_visa_gold.svg'),
  ('INDIAN', 'Indian Bank Mastercard Titanium', 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100', 'indian_mastercard_titanium', 'indian', '/cards/indian_mastercard_titanium.svg'),
  ('INDIAN', 'Indian Bank RuPay Classic', 'bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50', 'indian_rupay_classic', 'indian', '/cards/indian_rupay_classic.svg'),
  ('INDIAN', 'Indian Bank Bharat Card', 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50', 'indian_bharat', 'indian', '/cards/indian_bharat.svg'),
  ('INDIAN', 'Indian Bank Corporate', 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50', 'indian_corporate', 'indian', '/cards/indian_corporate.svg'),
  ('BOM', 'Bank of Maharashtra RuPay Select', 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100', 'bom_rupay_select', 'bom', '/cards/bom_rupay_select.svg'),
  ('BOM', 'Bank of Maharashtra RuPay Platinum', 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900', 'bom_rupay_platinum', 'bom', '/cards/bom_rupay_platinum.svg'),
  ('BOM', 'Bank of Maharashtra Visa Platinum', 'bg-gradient-to-br from-slate-600 to-blue-900 text-slate-100', 'bom_visa_platinum', 'bom', '/cards/bom_visa_platinum.svg'),
  ('BOM', 'Bank of Maharashtra Visa Gold', 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-50', 'bom_visa_gold', 'bom', '/cards/bom_visa_gold.svg'),
  ('BOM', 'Bank of Maharashtra RuPay Classic', 'bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50', 'bom_rupay_classic', 'bom', '/cards/bom_rupay_classic.svg'),
  ('BOM', 'MahaBank SBI Card ELITE', 'bg-gradient-to-br from-blue-900 to-black text-amber-400', 'bom_maha_sbi_elite', 'bom', '/cards/bom_maha_sbi_elite.svg'),
  ('BOM', 'MahaBank SBI Card PRIME', 'bg-gradient-to-br from-blue-700 to-blue-950 text-blue-100', 'bom_maha_sbi_prime', 'bom', '/cards/bom_maha_sbi_prime.svg'),
  ('BOM', 'MahaBank SBI Card Platinum', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-300', 'bom_maha_sbi_platinum', 'bom', '/cards/bom_maha_sbi_platinum.svg'),
  ('BOM', 'MahaBank SimplySAVE SBI Card', 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50', 'bom_simplysave_sbi', 'bom', '/cards/bom_simplysave_sbi.svg'),
  ('BOM', 'Bank of Maharashtra Corporate', 'bg-gradient-to-br from-emerald-600 to-teal-900 text-emerald-50', 'bom_corporate', 'bom', '/cards/bom_corporate.svg')
    ) as v(bank_name, card_name, style_classes, card_slug, bank_id, card_image_url)
    on conflict (card_id) do update set
      bank_name = excluded.bank_name,
      card_name = excluded.card_name,
      style_classes = excluded.style_classes,
      card_slug = excluded.card_slug,
      bank_id = excluded.bank_id,
      card_image_url = excluded.card_image_url,
      is_active = true;
  end if;

  -- Legacy slug aliases (run after upsert)
  update public.card_catalog set card_slug = 'hdfc_regalia_gold' where card_slug = 'hdfc_regalia';
  update public.card_catalog set card_slug = 'icici_amazon_pay' where card_slug = 'icici_amazon';
  update public.card_catalog set card_slug = 'icici_emeralde_private' where card_slug = 'icici_emeralde';
end $$;

-- ── Legacy slug cleanup (after live seed) ─────────────────────────────────────
update public.card_catalog set card_slug = 'hdfc_regalia_gold' where card_slug = 'hdfc_regalia';
update public.card_catalog set card_slug = 'icici_amazon_pay' where card_slug = 'icici_amazon';
update public.card_catalog set card_slug = 'icici_emeralde_private' where card_slug = 'icici_emeralde';

-- ── Verify (optional) ─────────────────────────────────────────────────────────
select count(*) as bank_count from public.card_banks;
select count(*) as active_cards from public.card_catalog where is_active = true;
select card_slug, bank_name, card_name from public.card_catalog_master limit 10;
