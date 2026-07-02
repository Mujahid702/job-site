-- Migration: 008_platform_ecosystem
-- Description: Establishes schemas for developer API keys, college departments, recruiter hiring campaigns, and mentor availabilities.

-- 1. Developer API Keys Table
create table if not exists public.developer_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  api_key text unique not null,
  label text default 'Default API Key' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. College Departments Analytics Table
create table if not exists public.college_departments (
  id uuid primary key default gen_random_uuid(),
  college_name text not null,
  department_name text not null,
  student_count integer default 0 not null,
  avg_readiness_score numeric default 0.0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_college_dept unique (college_name, department_name)
);

-- 3. Recruiter Campaigns Table
create table if not exists public.recruiter_campaigns (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  company text not null,
  target_role text not null,
  status text check (status in ('active', 'completed', 'paused', 'draft')) default 'draft' not null,
  applicants_count integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Mentor Slot Availabilities Table
create table if not exists public.mentor_availabilities (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS Enablement
alter table public.developer_api_keys enable row level security;
alter table public.college_departments enable row level security;
alter table public.recruiter_campaigns enable row level security;
alter table public.mentor_availabilities enable row level security;

-- Policies Setup
drop policy if exists "Users can read own developer api keys" on public.developer_api_keys;
create policy "Users can read own developer api keys" on public.developer_api_keys
  for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read college departments" on public.college_departments;
create policy "Anyone can read college departments" on public.college_departments
  for select using (true);

drop policy if exists "Recruiters can modify own campaigns" on public.recruiter_campaigns;
create policy "Recruiters can modify own campaigns" on public.recruiter_campaigns
  for all using (auth.uid() = recruiter_id or public.is_admin());

drop policy if exists "Anyone can read mentor slots" on public.mentor_availabilities;
create policy "Anyone can read mentor slots" on public.mentor_availabilities
  for select using (true);
