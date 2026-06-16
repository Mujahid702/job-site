-- SQL Migration to set up persistent Supabase tables and Row Level Security policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (for Resume Builder and career data)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone_number text,
  college text,
  degree text,
  branch text,
  graduation_year integer,
  current_semester integer,
  cgpa text,
  target_role text,
  skills text[],
  linkedin_url text,
  github_url text,
  portfolio_url text,
  resume_url text,
  resume_name text,
  resume_uploaded_at timestamptz,
  raw_profile_data jsonb, -- Keeps full resume builder details (education, experience, projects, etc.)
  onboarding_completed boolean default false,
  onboarding_status text default 'not_started',
  onboarding_step integer default 1,
  career_goal text,
  experience_level text,
  dream_companies text[],
  preferred_locations text[],
  target_ctc text,
  profile_completion integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Saved Jobs Table
create table if not exists public.saved_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.job_postings(id) on delete cascade,
  saved_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, job_id)
);

-- 3. Roadmap Progress Table
create table if not exists public.roadmap_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_name text not null,
  step_name text not null,
  completed boolean default false not null,
  completed_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, roadmap_name, step_name)
);

-- 4. Placement Scores Table
create table if not exists public.placement_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  score integer default 0,
  resume_score integer default 0,
  linkedin_score integer default 0,
  project_score integer default 0,
  interview_score integer default 0,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Resume Scans Table
create table if not exists public.resume_scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_name text,
  ats_score integer,
  role_fit_score integer,
  analysis jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. JD Matches Table
create table if not exists public.jd_matches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_role text,
  match_score integer,
  analysis jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. Mentor Bookings Table
create table if not exists public.mentor_bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mentor_name text,
  session_type text,
  booking_date timestamptz not null,
  status text default 'Pending',
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. Community Posts Table
create table if not exists public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  upvotes integer default 0,
  reports integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 9. Community Comments Table
create table if not exists public.community_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. Community Reports Table
create table if not exists public.community_reports (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(post_id, reporter_id)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.roadmap_progress enable row level security;
alter table public.placement_scores enable row level security;
alter table public.resume_scans enable row level security;
alter table public.jd_matches enable row level security;
alter table public.mentor_bookings enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;

-- Setup RLS Policies (User isolation: read/update/delete own; admin bypass)
-- Helper: Checks if the user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from auth.users
    where id = auth.uid()
    and (raw_user_meta_data->>'role' = 'admin' or raw_user_meta_data->>'role' = 'super_admin')
  );
end;
$$ language plpgsql security definer;

-- 1. Profiles RLS
create policy "Users can operate on own profile" on public.profiles
  for all using (auth.uid() = user_id or public.is_admin());

-- 2. Saved Jobs RLS
create policy "Users can operate on own saved jobs" on public.saved_jobs
  for all using (auth.uid() = user_id or public.is_admin());

-- 3. Roadmap Progress RLS
create policy "Users can operate on own roadmap progress" on public.roadmap_progress
  for all using (auth.uid() = user_id or public.is_admin());

-- 4. Placement Scores RLS
create policy "Users can operate on own placement scores" on public.placement_scores
  for all using (auth.uid() = user_id or public.is_admin());

-- 5. Resume Scans RLS
create policy "Users can operate on own resume scans" on public.resume_scans
  for all using (auth.uid() = user_id or public.is_admin());

-- 6. JD Matches RLS
create policy "Users can operate on own jd matches" on public.jd_matches
  for all using (auth.uid() = user_id or public.is_admin());

-- 7. Mentor Bookings RLS
create policy "Users can operate on own bookings" on public.mentor_bookings
  for all using (auth.uid() = user_id or public.is_admin());

-- 8. Community Posts RLS (Select allowed for all, write restricted)
create policy "Anyone can read community posts" on public.community_posts
  for select using (true);
create policy "Users can operate on own community posts" on public.community_posts
  for all using (auth.uid() = user_id or public.is_admin());

-- 9. Community Comments RLS (Select allowed for all, write restricted)
create policy "Anyone can read community comments" on public.community_comments
  for select using (true);
create policy "Users can operate on own comments" on public.community_comments
  for all using (auth.uid() = user_id or public.is_admin());

-- 10. Community Reports RLS (Only creator or admin can read/write)
create policy "Users can operate on own reports" on public.community_reports
  for all using (auth.uid() = reporter_id or public.is_admin());

-- 11. Applications Table (CRM & Application Tracker OS)
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_postings(id) on delete set null,
  job_title text not null,
  company text not null,
  application_link text,
  status text not null,
  applied_date timestamptz default timezone('utc'::text, now()) not null,
  last_updated timestamptz default timezone('utc'::text, now()) not null,
  next_step text,
  next_step_date timestamptz,
  salary text,
  location text,
  notes text,
  source text,
  details jsonb, -- To store rich schedules, oas, interviews, recruiter, offer, matchScore
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint check_status check (status in ('Saved', 'Applied', 'Assessment Scheduled', 'Assessment Completed', 'Technical Interview', 'HR Interview', 'Offer Received', 'Joined', 'Rejected', 'Withdrawn'))
);

-- 12. Application History Table (Status Timeline)
create table if not exists public.application_history (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null,
  changed_at timestamptz default timezone('utc'::text, now()) not null,
  notes text,
  constraint check_history_status check (status in ('Saved', 'Applied', 'Assessment Scheduled', 'Assessment Completed', 'Technical Interview', 'HR Interview', 'Offer Received', 'Joined', 'Rejected', 'Withdrawn'))
);

-- Enable RLS on new tables
alter table public.applications enable row level security;
alter table public.application_history enable row level security;

-- Setup RLS Policies for Applications
create policy "Users can operate on own applications" on public.applications
  for all using (auth.uid() = user_id or public.is_admin());

-- Setup RLS Policies for Application History
create policy "Users can operate on own application history" on public.application_history
  for all using (
    exists (
      select 1 from public.applications
      where id = application_id
      and (user_id = auth.uid() or public.is_admin())
    )
  );

-- 13. Resume Analytics Table
create table if not exists public.resume_analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resume_scans(id) on delete cascade,
  ats_score integer not null,
  role_fit_score integer not null,
  target_role text not null,
  keyword_score integer not null,
  format_score integer not null,
  readability_score integer not null,
  skills_score integer not null,
  projects_score integer not null,
  experience_score integer not null,
  analysis_date timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.resume_analytics enable row level security;

-- Setup RLS Policies for Resume Analytics
create policy "Users can operate on own resume analytics" on public.resume_analytics
  for all using (auth.uid() = user_id or public.is_admin());

-- 14. Placement Readiness Table
create table if not exists public.placement_readiness (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  pri_score integer default 0,
  resume_score integer default 0,
  application_score integer default 0,
  skills_score integer default 0,
  portfolio_score integer default 0,
  linkedin_score integer default 0,
  interview_score integer default 0,
  community_score integer default 0,
  consistency_score integer default 0,
  placement_level text default 'Placement Beginner',
  last_updated timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.placement_readiness enable row level security;

-- Setup RLS Policies for Placement Readiness
create policy "Users can operate on own placement readiness" on public.placement_readiness
  for all using (auth.uid() = user_id or public.is_admin());

-- 15. Audit Logs Table
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references auth.users(id) on delete set null,
  admin_name text not null,
  action text not null,
  timestamp timestamptz default timezone('utc'::text, now()) not null,
  details jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policies for Audit Logs
create policy "Admins can view audit logs" on public.audit_logs
  for select using (public.is_admin());

create policy "Admins can insert audit logs" on public.audit_logs
  for insert with check (public.is_admin());

-- 16. Analytics Daily Aggregations Table
create table if not exists public.analytics_daily (
  id uuid primary key default uuid_generate_v4(),
  date date unique not null,
  total_users integer default 0,
  active_users integer default 0,
  premium_users integer default 0,
  total_applications integer default 0,
  total_jobs integer default 0,
  community_members integer default 0,
  resume_scans integer default 0,
  revenue numeric default 0,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.analytics_daily enable row level security;
create policy "Admins can manage daily analytics" on public.analytics_daily
  for all using (public.is_admin());

-- 17. Analytics Monthly Aggregations Table
create table if not exists public.analytics_monthly (
  id uuid primary key default uuid_generate_v4(),
  month text unique not null, -- format: YYYY-MM
  total_users integer default 0,
  active_users integer default 0,
  premium_users integer default 0,
  total_applications integer default 0,
  total_jobs integer default 0,
  community_members integer default 0,
  resume_scans integer default 0,
  revenue numeric default 0,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.analytics_monthly enable row level security;
create policy "Admins can manage monthly analytics" on public.analytics_monthly
  for all using (public.is_admin());

-- 18. Analytics Events Table (for telemetry tracking e.g. AI calls, clicks)
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null, -- 'ats_scan', 'jd_match', 'resume_enhance', 'placement_copilot_request', 'page_view', etc.
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.analytics_events enable row level security;
create policy "Admins can manage analytics events" on public.analytics_events
  for all using (public.is_admin());

-- 19. Placement Missions Table
create table if not exists public.placement_missions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null,
  mission_type text not null check (mission_type in ('daily', 'weekly', 'career')),
  xp_reward integer not null default 10,
  pri_reward integer not null default 2,
  target_value integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 20. User Missions Table
create table if not exists public.user_missions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.placement_missions(id) on delete cascade,
  progress integer not null default 0,
  target integer not null default 1,
  completed boolean not null default false,
  claimed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, mission_id)
);

-- 21. User XP Table
create table if not exists public.user_xp (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  total_xp integer not null default 0,
  current_level integer not null default 1,
  streak_days integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Extend profiles to support badges
alter table public.profiles add column if not exists badges text[] default '{}'::text[];

-- Extend placement_readiness to support mission_bonus_score
alter table public.placement_readiness add column if not exists mission_bonus_score integer default 0;

-- Enable RLS on new tables
alter table public.placement_missions enable row level security;
alter table public.user_missions enable row level security;
alter table public.user_xp enable row level security;

-- Setup RLS Policies for Missions
create policy "Anyone can read active placement missions" on public.placement_missions
  for select using (is_active = true);

create policy "Admins can manage placement missions" on public.placement_missions
  for all using (public.is_admin());

create policy "Users can operate on own user_missions" on public.user_missions
  for all using (auth.uid() = user_id or public.is_admin());

create policy "Users can operate on own user_xp" on public.user_xp
  for all using (auth.uid() = user_id or public.is_admin());


