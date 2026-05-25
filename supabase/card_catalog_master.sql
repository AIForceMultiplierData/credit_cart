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

insert into public.card_banks (bank_id, bank_name, logo_url, brand_color, style_classes, display_order) values
  ('hdfc', 'HDFC', '/banks/hdfc.svg', '#004C8F', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100', 10),
  ('sbi', 'SBI', '/banks/sbi.svg', '#0096D6', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white', 20),
  ('icici', 'ICICI', '/banks/icici.svg', '#F37021', 'bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100', 30),
  ('axis', 'AXIS', '/banks/axis.svg', '#971237', 'bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white', 40),
  ('kotak', 'KOTAK', '/banks/kotak.svg', '#ED1C24', 'bg-gradient-to-br from-red-700 to-red-950 text-red-100', 50),
  ('idfc', 'IDFC', '/banks/idfc.svg', '#9D2235', 'bg-gradient-to-br from-rose-800 to-slate-900 text-rose-100', 60),
  ('indusind', 'INDUSIND', '/banks/indusind.svg', '#832729', 'bg-gradient-to-br from-amber-800 to-red-950 text-amber-100', 70),
  ('pnb', 'PNB', '/banks/pnb.svg', '#7D1935', 'bg-gradient-to-br from-red-900 to-amber-950 text-amber-100', 80),
  ('bob', 'BOB', '/banks/bob.svg', '#F57C00', 'bg-gradient-to-br from-orange-600 to-red-800 text-white', 90),
  ('canara', 'CANARA', '/banks/canara.svg', '#0084C7', 'bg-gradient-to-br from-blue-600 to-yellow-700 text-white', 100),
  ('union', 'UNION', '/banks/union.svg', '#D71920', 'bg-gradient-to-br from-red-600 to-blue-800 text-white', 110),
  ('boi', 'BOI', '/banks/boi.svg', '#0054A6', 'bg-gradient-to-br from-blue-800 to-orange-700 text-white', 120),
  ('iob', 'IOB', '/banks/iob.svg', '#0054A6', 'bg-gradient-to-br from-blue-700 to-orange-600 text-white', 130),
  ('idbi', 'IDBI', '/banks/idbi.svg', '#008C3A', 'bg-gradient-to-br from-green-700 to-orange-800 text-white', 140),
  ('yes', 'YES', '/banks/yes.svg', '#004A8F', 'bg-gradient-to-br from-blue-800 to-slate-900 text-blue-100', 150),
  ('rbl', 'RBL', '/banks/rbl.svg', '#0054A6', 'bg-gradient-to-br from-blue-700 to-slate-900 text-white', 160),
  ('hsbc', 'HSBC', '/banks/hsbc.svg', '#DB0011', 'bg-gradient-to-br from-red-700 to-slate-900 text-white', 170),
  ('amex', 'AMEX', '/banks/amex.svg', '#006FCF', 'bg-gradient-to-br from-blue-700 to-slate-800 text-white', 180),
  ('citi', 'CITI', '/banks/citi.svg', '#004B8D', 'bg-gradient-to-br from-blue-800 to-red-900 text-white', 190),
  ('sc', 'SC', '/banks/sc.svg', '#00857F', 'bg-gradient-to-br from-teal-600 to-green-700 text-white', 200),
  ('au', 'AU', '/banks/au.svg', '#6B21A8', 'bg-gradient-to-br from-purple-700 to-orange-600 text-white', 210),
  ('central', 'CENTRAL', '/banks/central.svg', '#004B8D', 'bg-gradient-to-br from-blue-800 to-slate-900 text-white', 220),
  ('uco', 'UCO', '/banks/uco.svg', '#0054A6', 'bg-gradient-to-br from-blue-700 to-slate-900 text-white', 230),
  ('indian', 'INDIAN', '/banks/indian.svg', '#0054A6', 'bg-gradient-to-br from-blue-800 to-blue-950 text-white', 240),
  ('bom', 'BOM', '/banks/bom.svg', '#0054A6', 'bg-gradient-to-br from-blue-700 to-indigo-900 text-white', 250)
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

-- Generate slugs from bank + card name (works when card_id is uuid)
update public.card_catalog
set card_slug = lower(
  regexp_replace(trim(bank_name), '[^a-zA-Z0-9]+', '_', 'g')
  || '_'
  || regexp_replace(trim(card_name), '[^a-zA-Z0-9]+', '_', 'g')
)
where card_slug is null or card_slug = '';

-- Known slug overrides (canonical app ids)
update public.card_catalog set card_slug = 'hdfc_millennia' where upper(bank_name) = 'HDFC' and card_name ilike '%millennia%';
update public.card_catalog set card_slug = 'hdfc_regalia' where upper(bank_name) = 'HDFC' and card_name ilike '%regalia%';
update public.card_catalog set card_slug = 'hdfc_diners' where upper(bank_name) = 'HDFC' and (card_name ilike '%diners%' or card_name ilike '%black%');
update public.card_catalog set card_slug = 'sbi_cashback' where upper(bank_name) = 'SBI' and card_name ilike '%cashback%';
update public.card_catalog set card_slug = 'sbi_simplyclick' where upper(bank_name) = 'SBI' and card_name ilike '%simplyclick%';
update public.card_catalog set card_slug = 'icici_amazon' where upper(bank_name) = 'ICICI' and card_name ilike '%amazon%';
update public.card_catalog set card_slug = 'icici_sapphiro' where upper(bank_name) = 'ICICI' and card_name ilike '%sapphiro%';
update public.card_catalog set card_slug = 'axis_flipkart' where upper(bank_name) = 'AXIS' and card_name ilike '%flipkart%';
update public.card_catalog set card_slug = 'axis_magnus' where upper(bank_name) = 'AXIS' and card_name ilike '%magnus%';
update public.card_catalog set card_slug = 'axis_vistara' where upper(bank_name) = 'AXIS' and card_name ilike '%vistara%';
update public.card_catalog set card_slug = 'axis_airtel' where upper(bank_name) = 'AXIS' and card_name ilike '%airtel%';
update public.card_catalog set card_slug = 'hdfc_swiggy' where upper(bank_name) = 'HDFC' and card_name ilike '%swiggy%';
update public.card_catalog set card_slug = 'hdfc_tata_neu' where upper(bank_name) = 'HDFC' and card_name ilike '%neu%';
update public.card_catalog set card_slug = 'hdfc_freedom' where upper(bank_name) = 'HDFC' and card_name ilike '%freedom%';
update public.card_catalog set card_slug = 'sbi_elite' where upper(bank_name) = 'SBI' and card_name ilike '%elite%';

-- Card face art (public/cards/*.svg)
update public.card_catalog set card_image_url = '/cards/hdfc_millennia.svg' where card_slug = 'hdfc_millennia';
update public.card_catalog set card_image_url = '/cards/hdfc_regalia.svg' where card_slug = 'hdfc_regalia';
update public.card_catalog set card_image_url = '/cards/hdfc_diners.svg' where card_slug = 'hdfc_diners';
update public.card_catalog set card_image_url = '/cards/hdfc_swiggy.svg' where card_slug = 'hdfc_swiggy';
update public.card_catalog set card_image_url = '/cards/hdfc_tata_neu.svg' where card_slug = 'hdfc_tata_neu';
update public.card_catalog set card_image_url = '/cards/hdfc_freedom.svg' where card_slug = 'hdfc_freedom';
update public.card_catalog set card_image_url = '/cards/sbi_cashback.svg' where card_slug = 'sbi_cashback';
update public.card_catalog set card_image_url = '/cards/sbi_simplyclick.svg' where card_slug = 'sbi_simplyclick';
update public.card_catalog set card_image_url = '/cards/sbi_elite.svg' where card_slug = 'sbi_elite';
update public.card_catalog set card_image_url = '/cards/icici_amazon.svg' where card_slug = 'icici_amazon';
update public.card_catalog set card_image_url = '/cards/icici_sapphiro.svg' where card_slug = 'icici_sapphiro';
update public.card_catalog set card_image_url = '/cards/axis_flipkart.svg' where card_slug = 'axis_flipkart';
update public.card_catalog set card_image_url = '/cards/axis_magnus.svg' where card_slug = 'axis_magnus';
update public.card_catalog set card_image_url = '/cards/axis_vistara.svg' where card_slug = 'axis_vistara';
update public.card_catalog set card_image_url = '/cards/axis_airtel.svg' where card_slug = 'axis_airtel';

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
create or replace view public.card_catalog_master as
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
