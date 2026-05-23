-- PoolPay co-purchase contracts (run in Supabase SQL Editor after profiles.sql)

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
