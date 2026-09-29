create extension if not exists pgcrypto;

do $$
begin
  create type public.job_status as enum (
    'new',
    'interested',
    'applied',
    'ignored'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  description text not null default '',
  source_query text not null,
  source text not null,
  company text,
  location text,
  discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status public.job_status not null default 'new'
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_discovered_at_idx
  on public.jobs (discovered_at desc);

alter table public.jobs enable row level security;

revoke all on table public.jobs from anon, authenticated;
grant select, insert, update on table public.jobs to anon;

drop policy if exists "Personal app can read jobs" on public.jobs;
create policy "Personal app can read jobs"
  on public.jobs for select
  to anon
  using (true);

drop policy if exists "Personal app can insert jobs" on public.jobs;
create policy "Personal app can insert jobs"
  on public.jobs for insert
  to anon
  with check (true);

drop policy if exists "Personal app can update jobs" on public.jobs;
create policy "Personal app can update jobs"
  on public.jobs for update
  to anon
  using (true)
  with check (true);
