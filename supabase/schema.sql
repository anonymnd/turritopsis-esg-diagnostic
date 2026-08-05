create table if not exists public.esg_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id text not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists esg_snapshots_company_id_idx
  on public.esg_snapshots (company_id);

alter table public.esg_snapshots enable row level security;

drop policy if exists "service role can manage esg snapshots" on public.esg_snapshots;
create policy "service role can manage esg snapshots"
  on public.esg_snapshots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
