-- PoolPay dispute resolution (run after contracts.sql + trust_score.sql)

create table if not exists public.disputes (
  dispute_id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (char_length(trim(reason)) > 0),
  status text not null default 'open' check (
    status in ('open', 'resolved', 'dismissed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists disputes_contract_id_idx on public.disputes (contract_id);
create index if not exists disputes_reporter_id_idx on public.disputes (reporter_id);
create index if not exists disputes_status_idx on public.disputes (status);

alter table public.disputes enable row level security;

drop policy if exists "Contract parties can read disputes" on public.disputes;
create policy "Contract parties can read disputes"
  on public.disputes for select
  using (
    reporter_id = auth.uid()
    or exists (
      select 1
      from public.contracts c
      where c.id = contract_id
        and (c.buyer_id = auth.uid() or c.lender_id = auth.uid())
    )
  );

drop policy if exists "Contract parties can report disputes" on public.disputes;
create policy "Contract parties can report disputes"
  on public.disputes for insert
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1
      from public.contracts c
      where c.id = contract_id
        and (c.buyer_id = auth.uid() or c.lender_id = auth.uid())
        and c.escrow_status in (
          'pending_acceptance',
          'escrow_locked',
          'order_placed'
        )
    )
  );

drop policy if exists "Parties can mark contract disputed" on public.contracts;
create policy "Parties can mark contract disputed"
  on public.contracts for update
  using (
  (auth.uid() = buyer_id or auth.uid() = lender_id)
  and escrow_status in ('pending_acceptance', 'escrow_locked', 'order_placed')
  )
  with check (
    (auth.uid() = buyer_id or auth.uid() = lender_id)
    and escrow_status = 'disputed'
  );
