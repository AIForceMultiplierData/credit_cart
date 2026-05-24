-- Repair public.contracts when table exists WITHOUT id column
-- (happens if an old/partial schema was created before contracts.sql)
--
-- Run this FIRST in Supabase SQL Editor, then lender_feed_fix.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) Create table from scratch if missing
-- ---------------------------------------------------------------------------

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  lender_id uuid references auth.users (id) on delete set null,
  product_name text not null,
  base_price numeric(12, 2) not null check (base_price >= 0),
  card_discount_amount numeric(12, 2) not null default 0 check (card_discount_amount >= 0),
  escrow_status text not null default 'pending_acceptance' check (
    escrow_status in (
      'pending_acceptance',
      'escrow_locked',
      'order_placed',
      'completed',
      'disputed',
      'cancelled'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2) Add missing columns on existing broken tables
-- ---------------------------------------------------------------------------

alter table public.contracts add column if not exists id uuid default gen_random_uuid();
alter table public.contracts add column if not exists buyer_id uuid references auth.users (id) on delete cascade;
alter table public.contracts add column if not exists lender_id uuid references auth.users (id) on delete set null;
alter table public.contracts add column if not exists product_name text;
alter table public.contracts add column if not exists base_price numeric(12, 2);
alter table public.contracts add column if not exists card_discount_amount numeric(12, 2) default 0;
alter table public.contracts add column if not exists escrow_status text default 'pending_acceptance';
alter table public.contracts add column if not exists created_at timestamptz default now();
alter table public.contracts add column if not exists updated_at timestamptz default now();

-- Backfill id for any rows created before id column existed
update public.contracts
set id = gen_random_uuid()
where id is null;

-- Backfill required fields if null (legacy rows)
update public.contracts
set
  product_name = coalesce(nullif(trim(product_name), ''), 'Untitled product'),
  base_price = coalesce(base_price, 0),
  card_discount_amount = coalesce(card_discount_amount, 0),
  escrow_status = coalesce(nullif(trim(escrow_status), ''), 'pending_acceptance'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where product_name is null
   or base_price is null
   or card_discount_amount is null
   or escrow_status is null
   or created_at is null
   or updated_at is null;

-- Enforce NOT NULL where possible (buyer_id must exist for valid rows)
-- Skip if you have orphan rows without buyer_id — fix those manually first.

do $$
begin
  if exists (
    select 1
    from public.contracts
    where buyer_id is null
  ) then
    raise notice 'contracts_schema_repair: some rows have null buyer_id — set buyer_id before enforcing NOT NULL';
  else
    alter table public.contracts alter column buyer_id set not null;
  end if;
exception
  when others then
    raise notice 'contracts_schema_repair: buyer_id NOT NULL skipped — %', sqlerrm;
end $$;

alter table public.contracts alter column id set not null;
alter table public.contracts alter column product_name set not null;
alter table public.contracts alter column base_price set not null;
alter table public.contracts alter column card_discount_amount set not null;
alter table public.contracts alter column escrow_status set not null;
alter table public.contracts alter column created_at set not null;
alter table public.contracts alter column updated_at set not null;

-- ---------------------------------------------------------------------------
-- 3) Primary key on id (if table had a different PK or none)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'contracts'
      and c.contype = 'p'
  ) then
    alter table public.contracts add primary key (id);
  end if;
exception
  when duplicate_table then
    null;
  when others then
    raise notice 'contracts_schema_repair: primary key — %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Indexes + base RLS (safe re-run)
-- ---------------------------------------------------------------------------

create index if not exists contracts_buyer_id_idx on public.contracts (buyer_id);
create index if not exists contracts_escrow_status_idx on public.contracts (escrow_status);

alter table public.contracts enable row level security;

drop policy if exists "Buyers can read own contracts" on public.contracts;
create policy "Buyers can read own contracts"
  on public.contracts for select
  using (auth.uid() = buyer_id or auth.uid() = lender_id);

drop policy if exists "Buyers can insert own contracts" on public.contracts;
create policy "Buyers can insert own contracts"
  on public.contracts for insert
  with check (auth.uid() = buyer_id);

drop policy if exists "Buyers can update own contracts" on public.contracts;
create policy "Buyers can update own contracts"
  on public.contracts for update
  using (auth.uid() = buyer_id or auth.uid() = lender_id);

grant select, insert, update on public.contracts to authenticated;

-- Verify (should return column list including id)
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name = 'contracts' order by ordinal_position;
