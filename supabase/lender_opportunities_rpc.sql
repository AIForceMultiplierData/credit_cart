-- Standalone RPC patch (only if lender_feed_fix.sql already ran but RPC failed)
-- Prefer running the full supabase/lender_feed_fix.sql instead.

create extension if not exists "pgcrypto";

alter table public.contracts add column if not exists id uuid default gen_random_uuid();
update public.contracts set id = gen_random_uuid() where id is null;
alter table public.contracts alter column id set not null;

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
  raise notice 'primary key: %', sqlerrm;
end $$;

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

grant select, insert, update on public.contracts to authenticated;

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
