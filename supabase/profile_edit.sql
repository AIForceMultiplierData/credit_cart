-- Profile display name + circle members (run in Supabase SQL Editor after profiles.sql)

alter table public.profiles
  add column if not exists full_name text;

alter table public.profiles
  add column if not exists circle_members jsonb not null default '[]'::jsonb;

create or replace function public.update_my_profile(p_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, cards, full_name)
  values (uid, '[]'::jsonb, nullif(trim(p_full_name), ''))
  on conflict (id) do update
  set full_name = nullif(trim(p_full_name), '');
end;
$$;

revoke all on function public.update_my_profile(text) from public;
grant execute on function public.update_my_profile(text) to authenticated;
