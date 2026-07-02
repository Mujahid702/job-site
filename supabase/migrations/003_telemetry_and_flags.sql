-- Migration: 003_telemetry_and_flags
-- Description: Sets up centralized error logging, performance telemetry, feature flags, audit trails, and migration trackers.

-- 1. Error Logs Table
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete set null,
  page text,
  browser text,
  device text,
  stack_trace text not null,
  api_endpoint text,
  latency integer
);

-- 2. Performance Metrics Table
create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete set null,
  page_load_ms integer,
  lcp_ms integer,
  fid_ms integer,
  api_latency_ms integer,
  ai_latency_ms integer,
  db_latency_ms integer,
  redis_latency_ms integer,
  memory_usage_mb numeric,
  cpu_usage_pct numeric
);

-- 3. Feature Flags Table
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean default true not null,
  description text,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Admin Audit Logs Table
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_name text not null,
  action text not null,
  details text,
  before_state jsonb,
  after_state jsonb,
  ip text,
  device text,
  timestamp timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Versioned Schema Migrations Table
create table if not exists public.schema_migrations (
  version text primary key,
  name text not null,
  checksum text not null,
  run_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.error_logs enable row level security;
alter table public.performance_metrics enable row level security;
alter table public.feature_flags enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Setup Security Policies
-- Error Logs: Anyone can insert logs, only admins can view.
drop policy if exists "Allow insert to error logs" on public.error_logs;
create policy "Allow insert to error logs" on public.error_logs
  for insert with check (true);

drop policy if exists "Allow admin select to error logs" on public.error_logs;
create policy "Allow admin select to error logs" on public.error_logs
  for select using (public.is_admin());

-- Performance Metrics: Anyone can insert, only admins can select.
drop policy if exists "Allow insert to performance metrics" on public.performance_metrics;
create policy "Allow insert to performance metrics" on public.performance_metrics
  for insert with check (true);

drop policy if exists "Allow admin select to performance metrics" on public.performance_metrics;
create policy "Allow admin select to performance metrics" on public.performance_metrics
  for select using (public.is_admin());

-- Feature Flags: Anyone can read, only admins can update/all.
drop policy if exists "Allow public read to feature flags" on public.feature_flags;
create policy "Allow public read to feature flags" on public.feature_flags
  for select using (true);

drop policy if exists "Allow admin update to feature flags" on public.feature_flags;
create policy "Allow admin update to feature flags" on public.feature_flags
  for all using (public.is_admin());

-- Admin Audit Logs: Only admins can view and write.
drop policy if exists "Allow admin full access to audit logs" on public.admin_audit_logs;
create policy "Allow admin full access to audit logs" on public.admin_audit_logs
  for all using (public.is_admin());

-- Seed Feature Flags
insert into public.feature_flags (key, enabled, description) values
  ('Resume OS', true, 'Evaluates ATS ratings, parsing matches, and compares JD contexts.'),
  ('Portfolio OS', true, 'Allows students to configure online landing portfolios.'),
  ('Project Advisor', true, 'Suggests specialized blueprints and FAANG system design targets.'),
  ('Assessment OS', true, 'Monitors diagnostic testing panels and WebAssembly coding sandboxes.'),
  ('Mentorship', true, 'Allows students to book slot schedules with industry mentors.'),
  ('Career Navigator', true, 'Generates 5-stage customized career checklists.'),
  ('Community', true, 'Feeds, commentary forums, groups tracking, and XP triggers.'),
  ('Recruiter CRM', true, 'LinkedIn validated recruiter candidate screening pipelines.'),
  ('Mock Interviews', true, 'FAANG Interview Station level 1-5 Q&A sets.'),
  ('Career Roadmaps', true, 'Interactive roadmaps visualization accordions.'),
  ('Copilot', true, 'AI Coach slide-over help drawer.'),
  ('Referral Engine', true, 'Referral links tracking, XP bonuses, and milestones unlocks.')
on conflict (key) do update set description = excluded.description;
