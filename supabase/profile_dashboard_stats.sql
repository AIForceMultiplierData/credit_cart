-- Dashboard stats on profiles (run after profiles.sql)

alter table public.profiles
  add column if not exists total_saved numeric(12, 2) not null default 0
  check (total_saved >= 0);

alter table public.profiles
  add column if not exists active_deals_count integer not null default 0
  check (active_deals_count >= 0);

comment on column public.profiles.total_saved is
  'Lifetime savings in INR from completed pool deals.';

comment on column public.profiles.active_deals_count is
  'Count of in-progress contracts (buyer or lender).';
