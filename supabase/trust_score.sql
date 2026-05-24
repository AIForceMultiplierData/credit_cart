-- PoolPay dynamic trust score engine (run after profiles.sql + contracts.sql)
-- Recalculates profiles.trust_score when contracts reach completed or disputed.

-- ---------------------------------------------------------------------------
-- Schema prep: full_name, disputed status, trust_score range 0–200
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists full_name text;

alter table public.profiles
  drop constraint if exists profiles_trust_score_check;

alter table public.profiles
  add constraint profiles_trust_score_check
  check (trust_score >= 0 and trust_score <= 200);

-- Allow disputed contracts (drop + recreate escrow_status check)
alter table public.contracts
  drop constraint if exists contracts_escrow_status_check;

alter table public.contracts
  add constraint contracts_escrow_status_check
  check (
    escrow_status in (
      'pending_acceptance',
      'escrow_locked',
      'order_placed',
      'completed',
      'disputed',
      'cancelled'
    )
  );

-- Backfill display names from auth metadata where available
update public.profiles p
set full_name = coalesce(
  nullif(trim(p.full_name), ''),
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
  split_part(u.email, '@', 1)
)
from auth.users u
where u.id = p.id;

-- ---------------------------------------------------------------------------
-- Task 1: Trust score calculation function
-- Base 100 · +5 per completed · -20 per disputed · clamped [0, 200]
-- ---------------------------------------------------------------------------

create or replace function public.calculate_user_trust_score(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_count integer := 0;
  disputed_count integer := 0;
  calculated_score integer := 100;
begin
  if target_user_id is null then
    return 100;
  end if;

  select count(*)::integer
  into completed_count
  from public.contracts c
  where c.escrow_status = 'completed'
    and (c.buyer_id = target_user_id or c.lender_id = target_user_id);

  select count(*)::integer
  into disputed_count
  from public.contracts c
  where c.escrow_status = 'disputed'
    and (c.buyer_id = target_user_id or c.lender_id = target_user_id);

  calculated_score := 100 + (completed_count * 5) - (disputed_count * 20);

  return greatest(0, least(200, calculated_score));
end;
$$;

comment on function public.calculate_user_trust_score(uuid) is
  'Returns dynamic trust score: 100 base, +5/completed contract, -20/disputed, clamped 0–200.';

-- ---------------------------------------------------------------------------
-- Task 2: Trigger — recalculate buyer + lender when status hits terminal states
-- ---------------------------------------------------------------------------

create or replace function public.sync_trust_scores_on_contract_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.escrow_status is distinct from old.escrow_status
     and new.escrow_status in ('completed', 'disputed') then

    update public.profiles
    set
      trust_score = public.calculate_user_trust_score(new.buyer_id),
      updated_at = now()
    where id = new.buyer_id;

    if new.lender_id is not null then
      update public.profiles
      set
        trust_score = public.calculate_user_trust_score(new.lender_id),
        updated_at = now()
      where id = new.lender_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_contract_trust_score_update on public.contracts;

create trigger on_contract_trust_score_update
after update of escrow_status on public.contracts
for each row
execute function public.sync_trust_scores_on_contract_status_change();

-- Optional: one-time recalc for all existing users
update public.profiles p
set
  trust_score = public.calculate_user_trust_score(p.id),
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Task 3: Leaderboard view
-- ---------------------------------------------------------------------------

create or replace view public.user_trust_leaderboard as
select
  coalesce(nullif(trim(full_name), ''), 'Anonymous') as full_name,
  trust_score
from public.profiles
order by trust_score desc, full_name asc;

comment on view public.user_trust_leaderboard is
  'Public-facing trust ranking ordered by trust_score descending.';

grant select on public.user_trust_leaderboard to authenticated;
grant select on public.user_trust_leaderboard to anon;

-- Keep signup hook in sync with display name
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, cards, full_name, trust_score)
  values (
    new.id,
    '[]'::jsonb,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    100
  )
  on conflict (id) do update
  set
    full_name = coalesce(
      excluded.full_name,
      public.profiles.full_name
    ),
    updated_at = now();

  return new;
end;
$$;
