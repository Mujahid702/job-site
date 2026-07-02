-- Migration: 004_student_intelligence
-- Description: Establishes schemas for student intelligence profile aggregator, topic knowledge graphs, explainable recommendations, and placement probabilities.

-- 1. Student Intelligence Profiles
create table if not exists public.student_intelligence_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  academic_info jsonb default '{}'::jsonb,
  target_roles text[] default '{}'::text[],
  preferred_companies text[] default '{}'::text[],
  skills_mastery jsonb default '{}'::jsonb,
  assessment_scores jsonb default '{"aptitude": 0, "coding": 0, "reasoning": 0, "verbal": 0, "sql": 0}'::jsonb,
  interview_scores jsonb default '{"technical": 0, "behavioral": 0, "communication": 0}'::jsonb,
  learning_speed numeric default 1.0,
  study_consistency numeric default 1.0,
  strong_topics text[] default '{}'::text[],
  weak_topics text[] default '{}'::text[],
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_intelligence unique (user_id)
);

-- 2. AI Knowledge Graphs
create table if not exists public.ai_knowledge_graphs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_id text not null,
  parent_topic_id text,
  mastery_level numeric default 0.0 not null,
  unlocked boolean default false not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_topic unique (user_id, topic_id)
);

-- 3. AI Recommendations & Feedback Loops
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  module text not null, -- e.g., 'Project OS', 'Roadmap', 'Interview'
  recommendation_type text not null,
  content jsonb default '{}'::jsonb not null,
  explanation text not null, -- Explainable AI rationale
  feedback text default 'ignored'::text check (feedback in ('helpful', 'not_helpful', 'ignored', 'completed')) not null,
  version integer default 1 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Placement Probabilities & Timeline Predictions
create table if not exists public.placement_probabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  prob_interview numeric default 0.0 not null,
  prob_oa numeric default 0.0 not null,
  prob_hr numeric default 0.0 not null,
  prob_placement numeric default 0.0 not null,
  confidence_lower numeric default 0.0 not null,
  confidence_upper numeric default 0.0 not null,
  readiness_timeline_days integer default 90 not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_probability unique (user_id)
);

-- 5. Placed Student Success Comparison Profiles
create table if not exists public.placed_student_success (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  company text not null,
  package_lpa numeric not null,
  skills text[] not null,
  avg_assessment numeric not null,
  avg_interview numeric not null,
  timeline_days integer not null
);

-- Enable RLS
alter table public.student_intelligence_profiles enable row level security;
alter table public.ai_knowledge_graphs enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.placement_probabilities enable row level security;
alter table public.placed_student_success enable row level security;

-- Policies Setup
drop policy if exists "Users can view own intelligence profiles" on public.student_intelligence_profiles;
create policy "Users can view own intelligence profiles" on public.student_intelligence_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Users/Admins can modify intelligence profiles" on public.student_intelligence_profiles;
create policy "Users/Admins can modify intelligence profiles" on public.student_intelligence_profiles
  for all using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can view own knowledge graph" on public.ai_knowledge_graphs;
create policy "Users can view own knowledge graph" on public.ai_knowledge_graphs
  for select using (auth.uid() = user_id);

drop policy if exists "Users/Admins can modify own knowledge graph" on public.ai_knowledge_graphs;
create policy "Users/Admins can modify own knowledge graph" on public.ai_knowledge_graphs
  for all using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can view own recommendations" on public.ai_recommendations;
create policy "Users can view own recommendations" on public.ai_recommendations
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own recommendations feedback" on public.ai_recommendations;
create policy "Users can update own recommendations feedback" on public.ai_recommendations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admins can insert recommendations" on public.ai_recommendations;
create policy "Admins can insert recommendations" on public.ai_recommendations
  for insert with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can view own placement probabilities" on public.placement_probabilities;
create policy "Users can view own placement probabilities" on public.placement_probabilities
  for select using (auth.uid() = user_id);

drop policy if exists "Admins can update placement probabilities" on public.placement_probabilities;
create policy "Admins can update placement probabilities" on public.placement_probabilities
  for all using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Anyone can read placed success analytics" on public.placed_student_success;
create policy "Anyone can read placed success analytics" on public.placed_student_success
  for select using (true);

drop policy if exists "Only admins can modify placed success templates" on public.placed_student_success;
create policy "Only admins can modify placed success templates" on public.placed_student_success
  for all using (public.is_admin());

-- Seed placed students historical data
insert into public.placed_student_success (role, company, package_lpa, skills, avg_assessment, avg_interview, timeline_days) values
  ('Software Engineer', 'Google', 32.5, array['Python', 'Go', 'Distributed Systems', 'Algorithms'], 92, 88, 120),
  ('Full Stack Developer', 'Microsoft', 28.0, array['React', 'TypeScript', 'Node.js', 'SQL'], 88, 85, 90),
  ('Backend Engineer', 'Amazon', 24.5, array['Java', 'Spring Boot', 'AWS', 'Docker'], 85, 82, 95)
on conflict (id) do nothing;
