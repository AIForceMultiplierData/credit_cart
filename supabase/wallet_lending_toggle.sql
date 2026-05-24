-- Wallet card lending toggle (run in Supabase SQL Editor after wallet_policies.sql)
--
-- Each object in profiles.cards jsonb array supports:
--   active_for_lending: boolean  (default false — opt in to Lender Desk)

create or replace function public.normalize_wallet_cards(p_cards jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    jsonb_agg(
      card
      || case
        when card ? 'active_for_lending' then '{}'::jsonb
        else jsonb_build_object('active_for_lending', false)
      end
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(p_cards, '[]'::jsonb)) as card;
$$;

create or replace function public.get_or_create_my_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wallet jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, cards)
  values (uid, '[]'::jsonb)
  on conflict (id) do nothing;

  select cards into wallet from public.profiles where id = uid;
  return public.normalize_wallet_cards(coalesce(wallet, '[]'::jsonb));
end;
$$;

create or replace function public.upsert_my_wallet(p_cards jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wallet jsonb;
  normalized jsonb := public.normalize_wallet_cards(coalesce(p_cards, '[]'::jsonb));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, cards)
  values (uid, normalized)
  on conflict (id) do update
    set cards = excluded.cards,
        updated_at = now();

  select cards into wallet from public.profiles where id = uid;
  return public.normalize_wallet_cards(coalesce(wallet, '[]'::jsonb));
end;
$$;

revoke all on function public.normalize_wallet_cards(jsonb) from public;
grant execute on function public.normalize_wallet_cards(jsonb) to authenticated;

revoke all on function public.get_or_create_my_wallet() from public;
revoke all on function public.upsert_my_wallet(jsonb) from public;
grant execute on function public.get_or_create_my_wallet() to authenticated;
grant execute on function public.upsert_my_wallet(jsonb) to authenticated;

-- Backfill existing wallets missing active_for_lending
update public.profiles
set cards = public.normalize_wallet_cards(cards)
where jsonb_typeof(cards) = 'array';
