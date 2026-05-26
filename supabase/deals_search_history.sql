-- PoolPay: per-user deal search history (unfiltered API payloads, chronological)

create table if not exists public.deals_search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('flight', 'hotels', 'product')),
  search_label text not null,
  request_body jsonb not null default '{}'::jsonb,
  result_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists deals_search_history_user_created_idx
  on public.deals_search_history (user_id, created_at desc);

alter table public.deals_search_history enable row level security;

drop policy if exists "Users read own search history" on public.deals_search_history;
create policy "Users read own search history"
  on public.deals_search_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own search history" on public.deals_search_history;
create policy "Users insert own search history"
  on public.deals_search_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own search history" on public.deals_search_history;
create policy "Users delete own search history"
  on public.deals_search_history for delete
  using (auth.uid() = user_id);
