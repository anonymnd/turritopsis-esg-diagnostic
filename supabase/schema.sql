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

-- Proof documents, now company-owned and persisted for real (previously
-- these lived only in React state / inside the esg_snapshots JSON blob and
-- vanished with the tab). file_path points into Supabase Storage bucket
-- "proofs" (private; access is via signed URL through api/documents.js,
-- never a public bucket) -- null when a document is text-only with no
-- attached file.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  title text not null,
  type text,
  content text,
  question_codes text[] not null default '{}',
  file_path text,
  file_type text,
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists documents_company_id_idx
  on public.documents (company_id);

alter table public.documents enable row level security;

drop policy if exists "service role can manage documents" on public.documents;
create policy "service role can manage documents"
  on public.documents
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- One dossier per company reporting cycle. This is the real unit the
-- reviewer workspace queues against, replacing the three hardcoded demo
-- company names that used to be the entire "reviewer queue". submitted_at
-- captures a frozen snapshot of the score at submission time so a PME
-- editing answers after submitting doesn't retroactively change what the
-- reviewer is looking at mid-review.
create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'validated', 'rejected')),
  declared_score integer,
  reviewed_score integer,
  final_score integer,
  snapshot jsonb,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dossiers_company_id_idx
  on public.dossiers (company_id);

create index if not exists dossiers_status_idx
  on public.dossiers (status);

alter table public.dossiers enable row level security;

drop policy if exists "service role can manage dossiers" on public.dossiers;
create policy "service role can manage dossiers"
  on public.dossiers
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Reviewer comments on a dossier, one row per note (not a single mutable
-- field) so the review has a real trail: what was said, by whom, when --
-- instead of the last comment silently overwriting the previous one.
create table if not exists public.dossier_notes (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  question_code text,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists dossier_notes_dossier_id_idx
  on public.dossier_notes (dossier_id);

alter table public.dossier_notes enable row level security;

drop policy if exists "service role can manage dossier_notes" on public.dossier_notes;
create policy "service role can manage dossier_notes"
  on public.dossier_notes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Append-only trail for sensitive actions (role changes, dossier
-- validation, certificate activation). Never updated or deleted from the
-- app -- if a row here is wrong, that is itself worth knowing.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_company_id_idx
  on public.audit_logs (company_id);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "service role can manage audit_logs" on public.audit_logs;
create policy "service role can manage audit_logs"
  on public.audit_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
