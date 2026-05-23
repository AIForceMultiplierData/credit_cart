-- PoolPay transactions ledger (run after contracts.sql)

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  transaction_type text not null check (
    transaction_type in ('escrow_deposit', 'payout', 'refund')
  ),
  status text not null check (status in ('pending', 'success', 'failed')),
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists transactions_contract_id_idx
  on public.transactions (contract_id);

alter table public.transactions enable row level security;

drop policy if exists "Contract parties can read transactions" on public.transactions;
create policy "Contract parties can read transactions"
  on public.transactions for select
  using (
    auth.uid() = buyer_id
    or exists (
      select 1
      from public.contracts c
      where c.id = contract_id
        and (c.buyer_id = auth.uid() or c.lender_id = auth.uid())
    )
  );

drop policy if exists "Contract parties can insert transactions" on public.transactions;
create policy "Contract parties can insert transactions"
  on public.transactions for insert
  with check (
    auth.uid() = buyer_id
    or exists (
      select 1
      from public.contracts c
      where c.id = contract_id
        and c.lender_id = auth.uid()
    )
  );
