-- Wallet save fix: ensure users can insert/update their own profile cards
-- Run in Supabase SQL Editor if "Save failed / Failed to update wallet" occurs

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

-- Backfill missing profiles for existing auth users
insert into public.profiles (id, cards)
select u.id, '[]'::jsonb
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
