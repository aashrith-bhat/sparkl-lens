-- SparkL Lens written-assessment sync schema (prototype)
-- Run this in the Supabase SQL editor before enabling sync in Settings.
--
-- This policy is permissive for a college prototype. It allows anyone with
-- the anon key to read and write these rows. Do not use it for real child
-- data without authentication, tighter RLS and a data-processing agreement.

create table if not exists public.written_assessments (
  id text primary key,
  learner_code text not null default '',
  subject text not null,
  centre text not null default '',
  completed_at timestamptz not null,
  band text not null,
  total_score integer not null default 0,
  max_score integer not null default 0,
  educator text not null default '',
  device_id text not null default '',
  updated_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists written_assessments_completed_at_idx
  on public.written_assessments (completed_at desc);

alter table public.written_assessments enable row level security;

drop policy if exists "prototype written read" on public.written_assessments;
create policy "prototype written read"
  on public.written_assessments
  for select
  to anon, authenticated
  using (true);

drop policy if exists "prototype written insert" on public.written_assessments;
create policy "prototype written insert"
  on public.written_assessments
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "prototype written update" on public.written_assessments;
create policy "prototype written update"
  on public.written_assessments
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Photo bucket. Keep it private; the app uploads with the anon key.
insert into storage.buckets (id, name, public)
values ('written-photos', 'written-photos', false)
on conflict (id) do nothing;

drop policy if exists "prototype written photo insert" on storage.objects;
create policy "prototype written photo insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'written-photos');

drop policy if exists "prototype written photo update" on storage.objects;
create policy "prototype written photo update"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'written-photos')
  with check (bucket_id = 'written-photos');

drop policy if exists "prototype written photo read" on storage.objects;
create policy "prototype written photo read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'written-photos');
