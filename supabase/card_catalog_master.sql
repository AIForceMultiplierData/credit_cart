-- PoolPay card master dimension (run in Supabase SQL Editor after card_catalog.sql)
-- Banks = master dimension for bank picker; card_catalog = card population for selection.

-- ── Banks master ─────────────────────────────────────────────────────────────
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
  ('indusind', 'INDUSIND', '/banks/indusind.svg', '#832729', 'bg-gradient-to-br from-amber-800 to-red-950 text-amber-100', 70)
on conflict (bank_id) do update set
  bank_name = excluded.bank_name,
  logo_url = excluded.logo_url,
  brand_color = excluded.brand_color,
  style_classes = excluded.style_classes,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- ── Extend card_catalog ────────────────────────────────────────────────────────
alter table public.card_catalog
  add column if not exists bank_id text references public.card_banks (bank_id),
  add column if not exists bank_logo_url text,
  add column if not exists network text,
  add column if not exists card_tier text,
  add column if not exists apply_url text,
  add column if not exists annual_fee_inr int,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill bank_id + logo from bank_name
update public.card_catalog c
set
  bank_id = b.bank_id,
  bank_logo_url = b.logo_url,
  updated_at = now()
from public.card_banks b
where upper(c.bank_name) = upper(b.bank_name)
  and (c.bank_id is null or c.bank_logo_url is null);

-- Seed apply URLs for known cards
update public.card_catalog set apply_url = 'https://www.hdfc.bank.in/credit-cards/millenia-credit-card', network = 'visa', card_tier = 'mid' where card_id = 'hdfc_millennia';
update public.card_catalog set apply_url = 'https://www.hdfc.bank.in/credit-cards/regalia-gold-credit-card', network = 'visa', card_tier = 'premium' where card_id = 'hdfc_regalia';
update public.card_catalog set apply_url = 'https://www.hdfc.bank.in/credit-cards/diners-club-black-credit-card', network = 'diners', card_tier = 'premium' where card_id = 'hdfc_diners';
update public.card_catalog set apply_url = 'https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.page', network = 'visa', card_tier = 'entry' where card_id = 'sbi_cashback';
update public.card_catalog set apply_url = 'https://www.sbicard.com/en/personal/credit-cards/simplyclick-sbi-card.page', network = 'visa', card_tier = 'entry' where card_id = 'sbi_simplyclick';
update public.card_catalog set apply_url = 'https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-icici-bank-credit-card', network = 'visa', card_tier = 'mid' where card_id = 'icici_amazon';
update public.card_catalog set apply_url = 'https://www.icicibank.com/personal-banking/cards/credit-card/sapphiro-credit-card', network = 'mastercard', card_tier = 'premium' where card_id = 'icici_sapphiro';
update public.card_catalog set apply_url = 'https://www.axis.bank.in/cards/credit-card/flipkart-axis-bank-credit-card', network = 'visa', card_tier = 'mid' where card_id = 'axis_flipkart';
update public.card_catalog set apply_url = 'https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card', network = 'visa', card_tier = 'premium' where card_id = 'axis_magnus';

-- ── Enriched read view (master dimension for UI) ─────────────────────────────
create or replace view public.card_catalog_master as
select
  c.card_id,
  c.bank_id,
  c.bank_name,
  coalesce(c.bank_logo_url, b.logo_url) as bank_logo_url,
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
