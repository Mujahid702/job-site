-- Migration: Project Templates Knowledge Base Tables
-- To run this migration: execute in Supabase SQL editor

-- 1. Project Templates Table
create table if not exists public.project_templates (
  id uuid primary key default uuid_generate_v4(),
  title text not null unique,
  role text not null,
  difficulty text not null,
  tech text[] not null,
  summary text not null,
  recommended_stack jsonb not null, -- { frontend: string, backend: string, database: string, cloud: string, monitoring: string }
  architecture jsonb not null, -- { systemOverview, flow, components, databaseDesign, apis, folderStructure, etc. }
  learning_outcomes text[] not null,
  recruiter_value text not null,
  is_featured boolean default false,
  is_trending boolean default false,
  is_beginner_friendly boolean default false,
  is_high_demand boolean default false,
  version integer default 1,
  analytics jsonb default '{"selection_count": 0, "completion_count": 0, "success_rate": 0, "rating": 5.0}'::jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.project_templates enable row level security;

-- 3. RLS Policies
drop policy if exists "Allow public read access to project templates" on public.project_templates;
create policy "Allow public read access to project templates" on public.project_templates
  for select using (true);

drop policy if exists "Allow admin write access to project templates" on public.project_templates;
create policy "Allow admin write access to project templates" on public.project_templates
  for all using (public.is_admin());

-- 4. Seed initial template (Full Stack - Expense Tracker)
insert into public.project_templates (
  title, role, difficulty, tech, summary, recommended_stack, architecture, learning_outcomes, recruiter_value, is_featured, is_trending, is_beginner_friendly, is_high_demand
) values (
  'Expense Tracker',
  'Full Stack Developer',
  'Beginner',
  ARRAY['React', 'Express', 'SQLite', 'Tailwind CSS'],
  'A personal finance logging system tracking monthly spending habits, category breakdowns, and basic budget caps alerts.',
  '{"frontend": "React with Tailwind CSS styling modules", "backend": "Express API server with SQLite connection pools", "database": "SQLite client-side relational tables", "cloud": "Vercel serverless functions hosting", "monitoring": "Structured console log formatting"}',
  '{"systemOverview": "Provides simple user authentication and transaction mappings.", "highLevel": "Frontend -> API Gateway -> Backend Services -> SQLite Database", "folderStructure": "client/\\nserver/"}',
  ARRAY['Relational schema design', 'Token validations', 'Responsive charts rendering'],
  'Demonstrates client-side state handling and simple clean APIs integration.',
  true,
  false,
  true,
  false
) on conflict (title) do nothing;
