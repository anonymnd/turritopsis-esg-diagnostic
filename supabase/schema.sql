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

-- One row per paid diagnostic. A certificate is "active" (score + report
-- unlocked, certificate valid) from paid_at until valid_until (1 year).
-- After that the user must pay again to get a new row -- retaking the
-- diagnostic does not extend an existing certificate.
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency text not null default 'mad',
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'canceled')),
  score_snapshot jsonb,
  reviewed_global_score integer,
  paid_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists certificates_user_id_idx
  on public.certificates (user_id);

create index if not exists certificates_user_status_idx
  on public.certificates (user_id, status, valid_until);

alter table public.certificates enable row level security;

drop policy if exists "service role can manage certificates" on public.certificates;
create policy "service role can manage certificates"
  on public.certificates
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Multi-tenant foundation. Until now a "dossier" was really just one
-- Supabase user account (esg_snapshots.company_id was the user's own uid),
-- so there was no way for more than one person to share a company's
-- diagnostic. companies is the real unit of ownership; company_users maps
-- people to it with a role. esg_snapshots.company_id keeps its existing
-- `text` type (no migration needed) and going forward stores a
-- companies.id (uuid) as text instead of a raw user id or a bare name.
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  country text,
  size text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_users (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'collaborator', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index if not exists company_users_user_id_idx
  on public.company_users (user_id);

alter table public.companies enable row level security;
alter table public.company_users enable row level security;

drop policy if exists "service role can manage companies" on public.companies;
create policy "service role can manage companies"
  on public.companies
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service role can manage company_users" on public.company_users;
create policy "service role can manage company_users"
  on public.company_users
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
