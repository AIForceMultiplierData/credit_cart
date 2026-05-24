-- Run once in Supabase SQL Editor (after contracts.sql + lender_feed_fix.sql)
-- Fixes false "Lender feed needs Supabase setup" when tables exist but view/RLS blocks reads.

create or replace function public.get_lender_opportunities()
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
    c.id,
    c.buyer_id,
    c.product_name,
    c.base_price,
    c.card_discount_amount,
    c.escrow_status,
    c.created_at
  from public.contracts c
  where c.escrow_status = 'pending_acceptance'
    and auth.uid() is not null
    and c.buyer_id <> auth.uid()
  order by c.created_at desc;
$$;

revoke all on function public.get_lender_opportunities() from public;
grant execute on function public.get_lender_opportunities() to authenticated;

grant select, insert, update on public.contracts to authenticated;
grant select on public.lender_opportunities to authenticated;
