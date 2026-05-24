-- Lender opportunity visibility + trust scores (run after profiles.sql + contracts.sql)

alter table public.profiles
  add column if not exists trust_score integer not null default 100
  check (trust_score >= 0 and trust_score <= 200);

drop policy if exists "Authenticated users can read buyer trust scores" on public.profiles;
create policy "Authenticated users can read buyer trust scores"
  on public.profiles for select
  using (auth.uid() is not null);

drop policy if exists "Buyers can read own contracts" on public.contracts;
create policy "Buyers can read own contracts"
  on public.contracts for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = lender_id
    or (
      escrow_status = 'pending_acceptance'
      and auth.uid() is not null
    )
  );

drop policy if exists "Lenders can accept pending contracts" on public.contracts;
create policy "Lenders can accept pending contracts"
  on public.contracts for update
  using (
    escrow_status = 'pending_acceptance'
    and lender_id is null
    and auth.uid() <> buyer_id
  )
  with check (
    auth.uid() = lender_id
    and escrow_status = 'escrow_locked'
    and auth.uid() <> buyer_id
  );
