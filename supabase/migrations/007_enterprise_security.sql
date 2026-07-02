-- Migration: 007_enterprise_security
-- Description: Sets up student/recruiter/admin active user session tracks, suspicious login blocks, and permission audit logs.

-- 1. Create Security Incidents Logs Table
create table if not exists public.security_incidents (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('failed_login', 'rate_limit', 'token_abuse', 'unauthorized_access', 'brute_force')),
  ip_address text not null,
  user_id uuid references auth.users(id) on delete set null,
  details jsonb default '{}'::jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Create Active User Sessions Table (Trusted Devices & Session Revocation)
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  device_name text default 'Unknown Device' not null,
  ip_address text not null,
  location text default 'General Location' not null,
  last_active_at timestamptz default timezone('utc'::text, now()) not null,
  revoked boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS Enablement
alter table public.security_incidents enable row level security;
alter table public.user_sessions enable row level security;

-- Setup Security Policies
drop policy if exists "Allow admins to read incidents" on public.security_incidents;
create policy "Allow admins to read incidents" on public.security_incidents
  for select using (public.is_admin());

drop policy if exists "Allow users to read own sessions" on public.user_sessions;
create policy "Allow users to read own sessions" on public.user_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "Allow users/admins to revoke sessions" on public.user_sessions;
create policy "Allow users/admins to revoke sessions" on public.user_sessions
  for all using (auth.uid() = user_id or public.is_admin());

-- 3. Create Session tracking index
create index if not exists user_sessions_active_idx on public.user_sessions (user_id, revoked);
