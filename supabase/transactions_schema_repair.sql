-- Optional: align legacy transactions table with PoolPay app (run if analytics still fails)
-- Check your columns first:
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name = 'transactions';

-- If you have transaction_id but no id, add id as alias column for app inserts:
alter table public.transactions
  add column if not exists id uuid;

update public.transactions
set id = transaction_id
where id is null
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'transaction_id'
  );

update public.transactions
set id = gen_random_uuid()
where id is null;

-- Only add PK if table has no primary key yet
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and contype = 'p'
  ) then
    alter table public.transactions
      add constraint transactions_pkey primary key (id);
  end if;
exception
  when others then
    raise notice 'transactions PK not altered: %', sqlerrm;
end $$;
