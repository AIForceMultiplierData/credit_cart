-- PoolPay analytics semantic layer (run after profiles, contracts, transactions, credit_card_leads)
-- Creates analytics schema with dimension/fact views + funnel rollups for dashboards.

create schema if not exists analytics;

-- ── dim_user ─────────────────────────────────────────────────────────────────
create or replace view analytics.dim_user as
with google_users as (
  select distinct user_id
  from auth.identities
  where provider = 'google'
),
wallet_stats as (
  select
    p.id as auth_user_id,
    coalesce(jsonb_array_length(p.cards), 0) as wallet_card_count,
    (
      select count(*)::int
      from jsonb_array_elements(coalesce(p.cards, '[]'::jsonb)) card
      where coalesce((card->>'active_for_lending')::boolean, false) = true
         or lower(coalesce(card->>'active_for_lending', '')) in ('true', '1', 'yes')
    ) as lending_active_card_count
  from public.profiles p
),
buyer_stats as (
  select buyer_id as auth_user_id, count(*)::int as contracts_as_buyer
  from public.contracts
  group by buyer_id
),
lender_stats as (
  select lender_id as auth_user_id, count(*)::int as contracts_as_lender
  from public.contracts
  where lender_id is not null
  group by lender_id
)
select
  p.id as user_key,
  p.id as auth_user_id,
  u.email,
  (gu.user_id is not null) as is_google_login,
  u.created_at as signed_up_at,
  u.last_sign_in_at,
  coalesce(ws.wallet_card_count, 0) as wallet_card_count,
  coalesce(ws.lending_active_card_count, 0) as lending_active_card_count,
  coalesce(bs.contracts_as_buyer, 0) as contracts_as_buyer,
  coalesce(ls.contracts_as_lender, 0) as contracts_as_lender,
  (coalesce(ws.wallet_card_count, 0) > 0) as has_wallet_card,
  (coalesce(bs.contracts_as_buyer, 0) > 0) as is_buyer,
  (coalesce(ls.contracts_as_lender, 0) > 0) as is_lender,
  (
    coalesce(ws.wallet_card_count, 0) > 0
    and coalesce(bs.contracts_as_buyer, 0) > 0
    and coalesce(ws.lending_active_card_count, 0) = 0
    and coalesce(ls.contracts_as_lender, 0) = 0
  ) as is_free_user,
  p.trust_score,
  p.total_saved,
  p.active_deals_count,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at
from public.profiles p
join auth.users u on u.id = p.id
left join google_users gu on gu.user_id = p.id
left join wallet_stats ws on ws.auth_user_id = p.id
left join buyer_stats bs on bs.auth_user_id = p.id
left join lender_stats ls on ls.auth_user_id = p.id;

-- ── dim_bank / dim_card ──────────────────────────────────────────────────────
create or replace view analytics.dim_bank as
select
  bank_id,
  bank_name,
  logo_url,
  brand_color,
  display_order,
  is_active
from public.card_banks;

create or replace view analytics.dim_card as
select
  coalesce(c.card_slug, c.card_id::text) as card_id,
  c.card_id as card_uuid,
  c.card_slug,
  c.bank_id,
  c.bank_name,
  c.card_name,
  c.network,
  c.card_tier,
  c.style_classes,
  c.apply_url,
  c.is_active
from public.card_catalog c;

-- ── fact_contracts ───────────────────────────────────────────────────────────
create or replace view analytics.fact_contracts as
select
  c.id as contract_id,
  c.buyer_id,
  c.lender_id,
  c.product_name,
  c.base_price,
  c.card_discount_amount,
  (c.base_price - c.card_discount_amount) as net_escrow_amount,
  c.escrow_status,
  c.created_at,
  c.updated_at,
  extract(epoch from (now() - c.created_at)) / 3600.0 as age_hours,
  (c.escrow_status = 'pending_acceptance') as is_pending_approval,
  (
    c.escrow_status = 'pending_acceptance'
    and c.created_at < now() - interval '24 hours'
  ) as pending_over_24h,
  (
    c.escrow_status = 'pending_acceptance'
    and c.created_at < now() - interval '48 hours'
  ) as pending_over_48h,
  (
    c.lender_id is not null
    and c.escrow_status in ('escrow_locked', 'order_placed', 'completed')
  ) as is_approved,
  date(c.created_at) as created_date_key
from public.contracts c;

-- ── fact_transactions ────────────────────────────────────────────────────────
create or replace view analytics.fact_transactions as
select
  t.id as transaction_id,
  t.contract_id,
  t.buyer_id,
  t.transaction_type,
  t.status,
  t.amount,
  t.created_at,
  date(t.created_at) as created_date_key
from public.transactions t;

-- ── fact_credit_card_leads ───────────────────────────────────────────────────
create or replace view analytics.fact_credit_card_leads as
select
  l.id as lead_id,
  l.user_id,
  l.card_id,
  l.bank_name,
  l.card_name,
  l.source,
  l.status,
  l.employment_type,
  l.monthly_in_hand_salary,
  l.created_at,
  date(l.created_at) as created_date_key
from public.credit_card_leads l;

-- ── fact_disputes / fact_fulfillment ─────────────────────────────────────────
create or replace view analytics.fact_disputes as
select
  d.dispute_id,
  d.contract_id,
  d.reporter_id,
  d.reason,
  d.status,
  d.created_at,
  date(d.created_at) as created_date_key
from public.disputes d;

create or replace view analytics.fact_fulfillment as
select
  f.id as fulfillment_id,
  f.contract_id,
  f.placed_by,
  f.tracking_number,
  f.created_at,
  date(f.created_at) as created_date_key
from public.fulfillment_logs f;

-- ── Funnel rollups ───────────────────────────────────────────────────────────
create or replace view analytics.v_user_funnel as
select
  count(*) filter (where is_google_login) as google_login_users,
  count(*) filter (where has_wallet_card) as users_with_card,
  count(*) filter (where is_buyer) as active_buyers,
  count(*) filter (where is_free_user) as free_users,
  count(*) filter (where lending_active_card_count > 0) as earning_mode_users,
  count(*) filter (where is_lender) as behavioral_lenders,
  count(*) as total_profiles,
  round(
    100.0 * count(*) filter (where has_wallet_card)
    / nullif(count(*) filter (where is_google_login), 0),
    2
  ) as google_to_card_pct,
  round(
    100.0 * count(*) filter (where is_buyer)
    / nullif(count(*) filter (where has_wallet_card), 0),
    2
  ) as card_to_buyer_pct,
  round(
    100.0 * count(*) filter (where is_free_user)
    / nullif(count(*) filter (where is_buyer), 0),
    2
  ) as buyer_to_free_user_pct
from analytics.dim_user;

create or replace view analytics.v_contract_funnel as
select
  count(*) as contracts_requested,
  count(*) filter (where is_pending_approval) as pending_approval,
  count(*) filter (where is_approved) as approved,
  count(*) filter (where escrow_status = 'completed') as completed,
  count(*) filter (where escrow_status = 'cancelled') as cancelled,
  count(*) filter (where escrow_status = 'disputed') as disputed,
  count(*) filter (where pending_over_24h) as pending_over_24h,
  count(*) filter (where pending_over_48h) as pending_over_48h,
  round(
    100.0 * count(*) filter (where is_approved) / nullif(count(*), 0),
    2
  ) as approval_rate_pct,
  round(
    100.0 * count(*) filter (where pending_over_24h)
    / nullif(count(*) filter (where is_pending_approval), 0),
    2
  ) as pending_24h_pct_of_pending,
  round(
    100.0 * count(*) filter (where pending_over_48h)
    / nullif(count(*) filter (where is_pending_approval), 0),
    2
  ) as pending_48h_pct_of_pending,
  round(avg(age_hours) filter (where is_pending_approval), 2) as avg_pending_age_hours
from analytics.fact_contracts;

create or replace view analytics.v_contracts_daily as
select
  created_date_key,
  count(*) as contracts_requested,
  count(*) filter (where is_pending_approval) as pending,
  count(*) filter (where is_approved) as approved,
  count(*) filter (where pending_over_24h) as sla_24h_breach
from analytics.fact_contracts
group by created_date_key
order by created_date_key desc;

revoke all on schema analytics from public;
grant usage on schema analytics to service_role;
grant select on all tables in schema analytics to service_role;

do $$
declare r record;
begin
  for r in
    select table_name
    from information_schema.views
    where table_schema = 'analytics'
  loop
    execute format('grant select on analytics.%I to service_role', r.table_name);
  end loop;
end $$;
