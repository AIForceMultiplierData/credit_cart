-- Wallet fix: RLS-safe RPC for loading/saving cards (run in Supabase SQL Editor)
-- Fixes: "new row violates row-level security policy for table profiles"

-- ---------------------------------------------------------------------------
-- 0) Ensure required columns exist on profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists cards jsonb not null default '[]'::jsonb;

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 1) Table policies (defense in depth)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on public.profiles to authenticated;
grant select on public.card_catalog to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 2) SECURITY DEFINER RPC — bypasses RLS safely for the signed-in user only
-- ---------------------------------------------------------------------------

create or replace function public.get_or_create_my_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wallet jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, cards)
  values (uid, '[]'::jsonb)
  on conflict (id) do nothing;

  select cards into wallet from public.profiles where id = uid;
  return coalesce(wallet, '[]'::jsonb);
end;
$$;

create or replace function public.upsert_my_wallet(p_cards jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wallet jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, cards)
  values (uid, coalesce(p_cards, '[]'::jsonb))
  on conflict (id) do update
    set cards = excluded.cards;

  select cards into wallet from public.profiles where id = uid;
  return coalesce(wallet, '[]'::jsonb);
end;
$$;

revoke all on function public.get_or_create_my_wallet() from public;
revoke all on function public.upsert_my_wallet(jsonb) from public;
grant execute on function public.get_or_create_my_wallet() to authenticated;
grant execute on function public.upsert_my_wallet(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Backfill missing profiles for existing auth users
-- ---------------------------------------------------------------------------

insert into public.profiles (id, cards)
select u.id, '[]'::jsonb
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
