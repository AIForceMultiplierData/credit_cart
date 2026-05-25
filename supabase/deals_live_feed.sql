-- PoolPay: cached Live Deals feed per user (run in Supabase SQL Editor)

create table if not exists public.deals_live_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deal_key text not null,
  availability text not null check (
    availability in ('ping_to_split', 'circle', 'wallet')
  ),
  deal_payload jsonb not null,
  used_serper boolean not null default false,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, deal_key)
);

create index if not exists deals_live_feed_user_id_idx
  on public.deals_live_feed (user_id);

create index if not exists deals_live_feed_user_availability_idx
  on public.deals_live_feed (user_id, availability);

alter table public.deals_live_feed enable row level security;

drop policy if exists "Users read own deals live feed" on public.deals_live_feed;
create policy "Users read own deals live feed"
  on public.deals_live_feed for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own deals live feed" on public.deals_live_feed;
create policy "Users insert own deals live feed"
  on public.deals_live_feed for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own deals live feed" on public.deals_live_feed;
create policy "Users delete own deals live feed"
  on public.deals_live_feed for delete
  using (auth.uid() = user_id);

drop policy if exists "Users update own deals live feed" on public.deals_live_feed;
create policy "Users update own deals live feed"
  on public.deals_live_feed for update
  using (auth.uid() = user_id);
