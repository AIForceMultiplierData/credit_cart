-- Admin read access for founder dashboard (run after contracts.sql)

drop policy if exists "Founder admin can read all contracts" on public.contracts;
create policy "Founder admin can read all contracts"
  on public.contracts for select
  using ((auth.jwt() ->> 'email') = 'founder@forcemultiplierdata.com');

drop policy if exists "Founder admin can read all disputes" on public.disputes;
create policy "Founder admin can read all disputes"
  on public.disputes for select
  using ((auth.jwt() ->> 'email') = 'founder@forcemultiplierdata.com');
