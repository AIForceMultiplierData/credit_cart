-- Fulfillment + shipping (run after profiles.sql + contracts.sql)

alter table public.profiles
  add column if not exists shipping_address text;

create table if not exists public.fulfillment_logs (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  placed_by uuid not null references auth.users (id) on delete cascade,
  tracking_number text not null,
  created_at timestamptz not null default now()
);

create index if not exists fulfillment_logs_contract_id_idx
  on public.fulfillment_logs (contract_id);

alter table public.fulfillment_logs enable row level security;

drop policy if exists "Contract parties can read fulfillment logs" on public.fulfillment_logs;
create policy "Contract parties can read fulfillment logs"
  on public.fulfillment_logs for select
  using (
    exists (
      select 1
      from public.contracts c
      where c.id = contract_id
        and (c.buyer_id = auth.uid() or c.lender_id = auth.uid())
    )
  );

drop policy if exists "Lenders can insert fulfillment logs" on public.fulfillment_logs;
create policy "Lenders can insert fulfillment logs"
  on public.fulfillment_logs for insert
  with check (
    placed_by = auth.uid()
    and exists (
      select 1
      from public.contracts c
      where c.id = contract_id
        and c.lender_id = auth.uid()
        and c.escrow_status = 'escrow_locked'
    )
  );

drop policy if exists "Lenders can read buyer shipping for fulfillment" on public.profiles;
create policy "Lenders can read buyer shipping for fulfillment"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.contracts c
      where c.buyer_id = profiles.id
        and c.lender_id = auth.uid()
        and c.escrow_status in ('escrow_locked', 'order_placed')
    )
  );

-- Enable Realtime (run once in Supabase Dashboard → Database → Replication if needed)
-- alter publication supabase_realtime add table public.contracts;
-- alter publication supabase_realtime add table public.fulfillment_logs;
