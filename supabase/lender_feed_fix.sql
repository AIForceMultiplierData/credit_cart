-- Lender feed fix (run in Supabase SQL Editor after profiles.sql + contracts.sql)
-- Fixes: "Could not load opportunities" on Deals tab

-- ---------------------------------------------------------------------------
-- 1) Schema: trust_score on profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists trust_score integer not null default 100;

alter table public.profiles
  drop constraint if exists profiles_trust_score_check;

alter table public.profiles
  add constraint profiles_trust_score_check
  check (trust_score >= 0 and trust_score <= 200);

-- ---------------------------------------------------------------------------
-- 2) Contracts: lenders can see pending marketplace deals
-- ---------------------------------------------------------------------------

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

grant select, insert, update on public.contracts to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Trust scores RPC (no extra columns exposed)
-- ---------------------------------------------------------------------------

create or replace function public.get_trust_scores(p_user_ids uuid[])
returns table (id uuid, trust_score integer)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.trust_score
  from public.profiles p
  where p.id = any (p_user_ids);
$$;

revoke all on function public.get_trust_scores(uuid[]) from public;
grant execute on function public.get_trust_scores(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Pending opportunities view (no lender_id column)
-- ---------------------------------------------------------------------------

create or replace view public.lender_opportunities as
select
  id,
  buyer_id,
  product_name,
  base_price,
  card_discount_amount,
  escrow_status,
  created_at
from public.contracts
where escrow_status = 'pending_acceptance';

grant select on public.lender_opportunities to authenticated;
