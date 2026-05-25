-- PoolPay card catalog (run in Supabase SQL Editor after profiles.sql)

create table if not exists public.card_catalog (
  card_id text primary key,
  bank_name text not null,
  card_name text not null,
  style_classes text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.card_catalog enable row level security;

drop policy if exists "Anyone can read active card catalog" on public.card_catalog;
create policy "Anyone can read active card catalog"
  on public.card_catalog for select
  using (is_active = true);

insert into public.card_catalog (card_id, bank_name, card_name, style_classes) values
  ('hdfc_millennia', 'HDFC', 'Millennia', 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-100'),
  ('hdfc_regalia', 'HDFC', 'Regalia Gold', 'bg-gradient-to-br from-yellow-700 to-amber-950 text-yellow-100'),
  ('hdfc_diners', 'HDFC', 'Diners Club Black', 'bg-gradient-to-br from-zinc-900 to-black text-slate-300'),
  ('hdfc_swiggy', 'HDFC', 'Swiggy', 'bg-gradient-to-br from-orange-500 to-purple-800 text-white'),
  ('hdfc_freedom', 'HDFC', 'Freedom', 'bg-gradient-to-br from-blue-800 to-blue-950 text-white'),
  ('hdfc_bizgrow', 'HDFC', 'BizGrow', 'bg-gradient-to-br from-blue-900 to-indigo-950 text-blue-100'),
  ('hdfc_iocl', 'HDFC', 'IndianOil', 'bg-gradient-to-br from-amber-700 to-orange-950 text-amber-100'),
  ('hdfc_irctc', 'HDFC', 'IRCTC', 'bg-gradient-to-br from-sky-700 to-blue-950 text-sky-100'),
  ('hdfc_pixel_play', 'HDFC', 'Pixel Play', 'bg-gradient-to-br from-cyan-600 to-blue-900 text-cyan-100'),
  ('sbi_elite', 'SBI', 'Elite', 'bg-gradient-to-br from-slate-800 to-blue-950 text-white'),
  ('sbi_prime', 'SBI', 'PRIME', 'bg-gradient-to-br from-slate-900 to-emerald-950 text-white'),
  ('sbi_cashback', 'SBI', 'Cashback Card', 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white'),
  ('sbi_simplyclick', 'SBI', 'SimplyCLICK', 'bg-gradient-to-br from-teal-400 to-emerald-700 text-white'),
  ('icici_amazon', 'ICICI', 'Amazon Pay', 'bg-gradient-to-br from-slate-800 to-orange-900 text-orange-100'),
  ('icici_sapphiro', 'ICICI', 'Sapphiro', 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200'),
  ('icici_coral', 'ICICI', 'Coral', 'bg-gradient-to-br from-orange-700 to-red-950 text-orange-100'),
  ('icici_emeralde', 'ICICI', 'Emeralde', 'bg-gradient-to-br from-emerald-800 to-green-950 text-emerald-100'),
  ('icici_rubyx', 'ICICI', 'Rubyx', 'bg-gradient-to-br from-red-800 to-rose-950 text-red-100'),
  ('axis_flipkart', 'AXIS', 'Flipkart Axis', 'bg-gradient-to-br from-purple-700 to-fuchsia-900 text-white'),
  ('axis_magnus', 'AXIS', 'Magnus', 'bg-gradient-to-br from-zinc-800 to-red-950 text-red-100')
on conflict (card_id) do update set
  bank_name = excluded.bank_name,
  card_name = excluded.card_name,
  style_classes = excluded.style_classes,
  is_active = true;
