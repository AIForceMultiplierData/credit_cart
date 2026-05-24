-- Lender feed fix — run in Supabase SQL Editor (single paste, safe to re-run)
--
-- Fixes: "column id does not exist" on view/RPC + Lender Desk setup hint

create extension if not exists "pgcrypto";

-- ===========================================================================
-- STEP A: Repair contracts table (must have id column before view/RPC)
-- ===========================================================================

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

alter table public.contracts add column if not exists id uuid default gen_random_uuid();
alter table public.contracts add column if not exists buyer_id uuid references auth.users (id) on delete cascade;
alter table public.contracts add column if not exists lender_id uuid references auth.users (id) on delete set null;
alter table public.contracts add column if not exists product_name text;
alter table public.contracts add column if not exists base_price numeric(12, 2);
alter table public.contracts add column if not exists card_discount_amount numeric(12, 2) default 0;
alter table public.contracts add column if not exists escrow_status text default 'pending_acceptance';
alter table public.contracts add column if not exists created_at timestamptz default now();
alter table public.contracts add column if not exists updated_at timestamptz default now();

update public.contracts set id = gen_random_uuid() where id is null;

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

do $$
begin
  if not exists (select 1 from public.contracts where buyer_id is null) then
    alter table public.contracts alter column buyer_id set not null;
  end if;
exception when others then
  raise notice 'buyer_id NOT NULL skipped: %', sqlerrm;
end $$;

alter table public.contracts alter column id set not null;
alter table public.contracts alter column product_name set not null;
alter table public.contracts alter column base_price set not null;
alter table public.contracts alter column card_discount_amount set not null;
alter table public.contracts alter column escrow_status set not null;
alter table public.contracts alter column created_at set not null;
alter table public.contracts alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'contracts' and c.contype = 'p'
  ) then
    alter table public.contracts add primary key (id);
  end if;
exception when others then
  raise notice 'primary key skipped: %', sqlerrm;
end $$;

create index if not exists contracts_buyer_id_idx on public.contracts (buyer_id);
create index if not exists contracts_escrow_status_idx on public.contracts (escrow_status);

-- ===========================================================================
-- STEP B: trust_score on profiles
-- ===========================================================================

alter table public.profiles
  add column if not exists trust_score integer not null default 100;

alter table public.profiles
  drop constraint if exists profiles_trust_score_check;

alter table public.profiles
  add constraint profiles_trust_score_check
  check (trust_score >= 0 and trust_score <= 200);

-- ===========================================================================
-- STEP C: Lender RLS policies
-- ===========================================================================

alter table public.contracts enable row level security;

drop policy if exists "Buyers can read own contracts" on public.contracts;
create policy "Buyers can read own contracts"
  on public.contracts for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = lender_id
    or (
      escrow_status = 'pending_acceptance'
      and auth.uid() is not null
    )
  );

drop policy if exists "Lenders can accept pending contracts" on public.contracts;
create policy "Lenders can accept pending contracts"
  on public.contracts for update
  using (
    escrow_status = 'pending_acceptance'
    and lender_id is null
    and auth.uid() <> buyer_id
  )
  with check (
    auth.uid() = lender_id
    and escrow_status = 'escrow_locked'
    and auth.uid() <> buyer_id
  );

drop policy if exists "Buyers can insert own contracts" on public.contracts;
create policy "Buyers can insert own contracts"
  on public.contracts for insert
  with check (auth.uid() = buyer_id);

drop policy if exists "Buyers can update own contracts" on public.contracts;
create policy "Buyers can update own contracts"
  on public.contracts for update
  using (auth.uid() = buyer_id or auth.uid() = lender_id);

grant select, insert, update on public.contracts to authenticated;

-- ===========================================================================
-- STEP D: Trust scores RPC (explicit aliases avoid "column id" ambiguity)
-- ===========================================================================

drop function if exists public.get_trust_scores(uuid[]);

create function public.get_trust_scores(p_user_ids uuid[])
returns table (
  id uuid,
  trust_score integer
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id as id, p.trust_score as trust_score
  from public.profiles p
  where p.id = any (p_user_ids);
$$;

revoke all on function public.get_trust_scores(uuid[]) from public;
grant execute on function public.get_trust_scores(uuid[]) to authenticated;

-- ===========================================================================
-- STEP E: View + RPC (only after contracts.id exists)
-- ===========================================================================

drop view if exists public.lender_opportunities;

create view public.lender_opportunities
with (security_invoker = true)
as
select
  c.id,
  c.buyer_id,
  c.product_name,
  c.base_price,
  c.card_discount_amount,
  c.escrow_status,
  c.created_at
from public.contracts c
where c.escrow_status = 'pending_acceptance';

grant select on public.lender_opportunities to authenticated;

drop function if exists public.get_lender_opportunities();

create function public.get_lender_opportunities()
returns table (
  id uuid,
  buyer_id uuid,
  product_name text,
  base_price numeric,
  card_discount_amount numeric,
  escrow_status text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.id as id,
    c.buyer_id as buyer_id,
    c.product_name as product_name,
    c.base_price as base_price,
    c.card_discount_amount as card_discount_amount,
    c.escrow_status as escrow_status,
    c.created_at as created_at
  from public.contracts c
  where c.escrow_status = 'pending_acceptance'
    and auth.uid() is not null
    and c.buyer_id <> auth.uid()
  order by c.created_at desc;
$$;

revoke all on function public.get_lender_opportunities() from public;
grant execute on function public.get_lender_opportunities() to authenticated;

-- Verify:
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'contracts' order by 1;
-- select * from public.get_lender_opportunities() limit 1;
