import { writeFileSync } from "fs"
import { INDIAN_AIRPORTS_SEED } from "../lib/indian-airports-seed.ts"

const esc = (s) => String(s).replace(/'/g, "''")
const rows = INDIAN_AIRPORTS_SEED.map(
  (r) =>
    `  ('${esc(r.iata_code)}', '${esc(r.city)}', '${esc(r.airport_name)}', '${esc(r.state)}', '${esc(r.label)}')`
).join(",\n")

const sql = `-- PoolPay Indian airports dimension (run in Supabase SQL Editor)
create table if not exists public.indian_airports (
  iata_code text primary key,
  city text not null,
  airport_name text not null,
  state text not null,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.indian_airports enable row level security;

drop policy if exists "Anyone can read active indian airports" on public.indian_airports;
create policy "Anyone can read active indian airports"
  on public.indian_airports for select
  using (is_active = true);

insert into public.indian_airports (iata_code, city, airport_name, state, label) values
${rows}
on conflict (iata_code) do update set
  city = excluded.city,
  airport_name = excluded.airport_name,
  state = excluded.state,
  label = excluded.label,
  is_active = true;
`

writeFileSync("supabase/indian_airports.sql", sql)
console.log(`Wrote ${INDIAN_AIRPORTS_SEED.length} airports to supabase/indian_airports.sql`)
