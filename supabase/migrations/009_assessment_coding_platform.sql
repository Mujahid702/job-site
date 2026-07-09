-- ==========================================================
-- 009_assessment_coding_platform.sql
-- ==========================================================

-- 1. Modify public.assessment_questions to add coding/SQL support
alter table public.assessment_questions 
add column if not exists type text default 'MCQ' check (type in ('MCQ', 'Coding', 'SQL')),
add column if not exists constraints text,
add column if not exists input_format text,
add column if not exists output_format text,
add column if not exists sample_test_cases jsonb default '[]'::jsonb,
add column if not exists sql_schema_seed text,
add column if not exists starter_codes jsonb default '{}'::jsonb;

-- 2. Create public.assessment_test_cases
create table if not exists public.assessment_test_cases (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  input text not null,
  expected_output text not null,
  is_hidden boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Create public.assessment_submissions
create table if not exists public.assessment_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  attempt_id text references public.assessment_attempts(id) on delete set null,
  language text not null,
  code_content text not null,
  status text not null check (status in ('Accepted', 'Wrong Answer', 'Compile Error', 'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded')),
  execution_time_ms integer,
  memory_used_kb integer,
  passed_test_cases integer not null,
  total_test_cases integer not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Create public.assessment_roadmaps
create table if not exists public.assessment_roadmaps (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references public.assessment_topics(id) on delete cascade,
  theory_content text,
  video_urls jsonb default '[]'::jsonb,
  cheat_sheet_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Create public.assessment_streaks
create table if not exists public.assessment_streaks (
  user_id text primary key,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_solved_date date,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS Alterations & Security Policies
alter table public.assessment_test_cases enable row level security;
alter table public.assessment_submissions enable row level security;
alter table public.assessment_roadmaps enable row level security;
alter table public.assessment_streaks enable row level security;

-- Policies Checks
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'assessment_test_cases' and policyname = 'Allow read test cases'
  ) then
    create policy "Allow read test cases" on public.assessment_test_cases for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'assessment_submissions' and policyname = 'Allow read submissions'
  ) then
    create policy "Allow read submissions" on public.assessment_submissions for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'assessment_submissions' and policyname = 'Allow user modify submissions'
  ) then
    create policy "Allow user modify submissions" on public.assessment_submissions for all using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'assessment_roadmaps' and policyname = 'Allow read roadmaps'
  ) then
    create policy "Allow read roadmaps" on public.assessment_roadmaps for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'assessment_streaks' and policyname = 'Allow user access streaks'
  ) then
    create policy "Allow user access streaks" on public.assessment_streaks for all using (true);
  end if;
end $$;
