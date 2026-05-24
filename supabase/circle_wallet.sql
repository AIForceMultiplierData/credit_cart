-- Circle wallet cards for deal search (run after profile_edit.sql + wallet_policies.sql)

alter table public.profiles
  add column if not exists circle_members jsonb not null default '[]'::jsonb;

create or replace function public.get_deal_search_cards()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  my_name text;
  result jsonb := '[]'::jsonb;
  member jsonb;
  member_id uuid;
  member_name text;
  member_cards jsonb;
  card jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(nullif(trim(full_name), ''), 'You')
  into my_name
  from public.profiles
  where id = uid;

  insert into public.profiles (id, cards)
  values (uid, '[]'::jsonb)
  on conflict (id) do nothing;

  select cards into member_cards from public.profiles where id = uid;

  if jsonb_typeof(member_cards) = 'array' then
    for card in select value from jsonb_array_elements(member_cards)
    loop
      if card ? 'card_id' or card ? 'id' then
        result := result || jsonb_build_array(
          jsonb_build_object(
            'card_id', coalesce(card->>'card_id', card->>'id'),
            'bank_name', coalesce(card->>'bank_name', card->>'bank', ''),
            'card_name', coalesce(card->>'card_name', card->>'name', card->>'network', ''),
            'source', 'wallet',
            'owner_user_id', uid::text,
            'owner_name', my_name
          )
        );
      end if;
    end loop;
  end if;

  for member in
    select value
    from public.profiles p,
      lateral jsonb_array_elements(coalesce(p.circle_members, '[]'::jsonb))
    where p.id = uid
  loop
    member_id := nullif(member->>'user_id', '')::uuid;
    member_name := coalesce(nullif(trim(member->>'name'), ''), 'Circle member');

    if member_id is null or member_id = uid then
      continue;
    end if;

    select cards into member_cards
    from public.profiles
    where id = member_id;

    if member_cards is null or jsonb_typeof(member_cards) <> 'array' then
      continue;
    end if;

    select coalesce(nullif(trim(full_name), ''), member_name)
    into member_name
    from public.profiles
    where id = member_id;

    for card in select value from jsonb_array_elements(member_cards)
    loop
      if card ? 'card_id' or card ? 'id' then
        result := result || jsonb_build_array(
          jsonb_build_object(
            'card_id', coalesce(card->>'card_id', card->>'id'),
            'bank_name', coalesce(card->>'bank_name', card->>'bank', ''),
            'card_name', coalesce(card->>'card_name', card->>'name', card->>'network', ''),
            'source', 'circle',
            'owner_user_id', member_id::text,
            'owner_name', member_name
          )
        );
      end if;
    end loop;
  end loop;

  return result;
end;
$$;

revoke all on function public.get_deal_search_cards() from public;
grant execute on function public.get_deal_search_cards() to authenticated;
