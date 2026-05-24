-- Credit card application leads (run in Supabase SQL Editor after profiles.sql)

create table if not exists public.credit_card_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text,
  bank_name text,
  card_name text,
  full_name text not null check (char_length(trim(full_name)) > 0),
  aadhar_number text not null check (aadhar_number ~ '^\d{12}$'),
  pan_number text not null check (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  aadhar_document_path text,
  pan_document_path text,
  monthly_in_hand_salary numeric(12, 2) not null check (monthly_in_hand_salary > 0),
  employment_type text not null check (
    employment_type in ('employed', 'self_employed')
  ),
  employer_name text,
  self_employed_description text,
  source text not null default 'apply_cta',
  status text not null default 'new' check (
    status in ('new', 'contacted', 'submitted', 'closed')
  ),
  created_at timestamptz not null default now(),
  constraint credit_card_leads_employment_details check (
    (
      employment_type = 'employed'
      and employer_name is not null
      and char_length(trim(employer_name)) > 0
    )
    or (
      employment_type = 'self_employed'
      and self_employed_description is not null
      and char_length(trim(self_employed_description)) > 0
    )
  )
);

create index if not exists credit_card_leads_user_id_idx
  on public.credit_card_leads (user_id);

create index if not exists credit_card_leads_status_idx
  on public.credit_card_leads (status);

create index if not exists credit_card_leads_created_at_idx
  on public.credit_card_leads (created_at desc);

alter table public.credit_card_leads enable row level security;

drop policy if exists "Users can insert own credit card leads" on public.credit_card_leads;
create policy "Users can insert own credit card leads"
  on public.credit_card_leads for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can read own credit card leads" on public.credit_card_leads;
create policy "Users can read own credit card leads"
  on public.credit_card_leads for select
  using (user_id = auth.uid());

-- Storage bucket for Aadhaar / PAN uploads (PDF max 2MB enforced in app)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'credit-card-leads',
  'credit-card-leads',
  false,
  2097152,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own lead documents" on storage.objects;
create policy "Users upload own lead documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'credit-card-leads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read own lead documents" on storage.objects;
create policy "Users read own lead documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'credit-card-leads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
