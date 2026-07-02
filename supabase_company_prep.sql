-- SQL Migration to set up admin-controlled company preparation playbooks

-- 1. Company Preps Table
create table if not exists public.company_preps (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  overview text,
  difficulty text not null check (difficulty in ('Medium', 'Hard', 'Extreme')),
  salary_range text not null,
  eligibility_cgpa numeric default 6.0,
  eligibility_branches text[] default '{}'::text[],
  eligibility_criteria text,
  hiring_frequency text default 'Annual',
  roles_hired text[] default '{}'::text[],
  must_have_skills text[] default '{}'::text[],
  good_to_have_skills text[] default '{}'::text[],
  bonus_skills text[] default '{}'::text[],
  package_value text,
  active_rounds integer default 0,
  role_details jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Hiring Process Rounds Table
create table if not exists public.company_prep_rounds (
  id uuid primary key default uuid_generate_v4(),
  company_prep_id uuid not null references public.company_preps(id) on delete cascade,
  round_number integer not null,
  name text not null,
  duration text,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  tips text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (company_prep_id, round_number)
);

-- 3. Round Resources Table
create table if not exists public.company_prep_resources (
  id uuid primary key default uuid_generate_v4(),
  company_prep_id uuid not null references public.company_preps(id) on delete cascade,
  round_number integer not null default 0, -- 0 refers to general resource
  name text not null,
  type text not null check (type in ('pdf', 'link', 'video', 'sheet')),
  url text not null,
  description text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Analytics Tracker Table
create table if not exists public.company_prep_analytics (
  id uuid primary key default uuid_generate_v4(),
  company_prep_id uuid not null unique references public.company_preps(id) on delete cascade,
  views_count integer default 0,
  attempts_count integer default 0,
  completion_count integer default 0,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Student Personalized Roadmaps Table
create table if not exists public.company_prep_user_roadmaps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_prep_id uuid not null references public.company_preps(id) on delete cascade,
  target_role text not null,
  personalized_roadmap jsonb not null, -- Stores week-by-week/milestone personalized checklist
  completed_steps text[] default '{}'::text[] not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, company_prep_id, target_role)
);

-- Enable Row Level Security (RLS)
alter table public.company_preps enable row level security;
alter table public.company_prep_rounds enable row level security;
alter table public.company_prep_resources enable row level security;
alter table public.company_prep_analytics enable row level security;
alter table public.company_prep_user_roadmaps enable row level security;

-- Setup RLS Policies

-- Company Preps Policies
create policy "Allow public read access to active company preps" on public.company_preps
  for select using (is_active = true);

create policy "Allow admin write access to company preps" on public.company_preps
  for all using (public.is_admin());

-- Company Prep Rounds Policies
create policy "Allow public read access to rounds" on public.company_prep_rounds
  for select using (true);

create policy "Allow admin write access to rounds" on public.company_prep_rounds
  for all using (public.is_admin());

-- Company Prep Resources Policies
create policy "Allow public read access to resources" on public.company_prep_resources
  for select using (true);

create policy "Allow admin write access to resources" on public.company_prep_resources
  for all using (public.is_admin());

-- Company Prep Analytics Policies
create policy "Allow select access on analytics to admin" on public.company_prep_analytics
  for select using (public.is_admin());

create policy "Allow all access on analytics to admin" on public.company_prep_analytics
  for all using (public.is_admin());

-- Company Prep User Roadmaps Policies
create policy "Allow users to view own roadmaps" on public.company_prep_user_roadmaps
  for select using (user_id = auth.uid() or public.is_admin());

create policy "Allow users to modify own roadmaps" on public.company_prep_user_roadmaps
  for all using (user_id = auth.uid() or public.is_admin());


-- 6. Seed Default Playbooks

-- 6.1. AMAZON SDE
insert into public.company_preps (slug, name, overview, difficulty, salary_range, eligibility_cgpa, eligibility_branches, eligibility_criteria, hiring_frequency, roles_hired, must_have_skills, good_to_have_skills, bonus_skills, package_value, active_rounds)
values (
  'amazon',
  'Amazon',
  'Amazon is a global technology pioneer hiring SDE candidates for deep customer-focused engineering platforms. The hiring cycle focuses on core Data Structures, System Design, and Amazon Leadership Principles.',
  'Extreme',
  '₹18 - ₹45 LPA',
  7.0,
  array['Computer Science', 'Information Technology', 'Software Engineering', 'Electronics'],
  'Minimum 70% or 7.0 CGPA, no active backlogs, maximum 1 year academic gap.',
  'Annual / Off-campus',
  array['Software Development Engineer I (SDE 1)', 'SDE Intern', 'Support Engineer'],
  array['Data Structures & Algorithms', 'System Design (LLD/HLD)', 'Java, C++, or Python'],
  array['SQL & Transaction Databases', 'Amazon Leadership Principles', 'Operating Systems (Threads/Locks)'],
  array['AWS Cloud Foundations', 'Microservices Architecture'],
  '₹18 - ₹45 LPA',
  4
) on conflict (slug) do nothing;

-- 6.1.2. Amazon Rounds
insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 1, 'Online Assessment (OA)', '120 Minutes', 'Hard', 'Features 2 algorithmic coding questions (LeetCode medium/hard) and a work style simulation section assessing customer obsession and bias for action.'
from public.company_preps where slug = 'amazon'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 2, 'Technical Interview - Coding', '60 Minutes', 'Hard', 'Expect questions on graphs (BFS/DFS), dynamic programming, or heap trees. Be prepared to dry run your solution and state the time and space complexities.'
from public.company_preps where slug = 'amazon'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 3, 'Technical Interview - Design (LLD)', '60 Minutes', 'Hard', 'Design a scalable real-world application (e.g. Parking Lot, Movie Booking). Draw class diagrams, define design pattern interfaces, and describe database tables.'
from public.company_preps where slug = 'amazon'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 4, 'Bar Raiser Round (HR & Strategy)', '60 Minutes', 'Hard', 'Focuses 50% on Leadership Principles. Be prepared with STAR format stories highlighting Ownership, Deliver Results, and disagreeing while committing.'
from public.company_preps where slug = 'amazon'
on conflict (company_prep_id, round_number) do nothing;

-- 6.1.3. Amazon Resources
insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 1, 'Amazon OA Algorithmic Practice Guide.pdf', 'pdf', 'https://example.com/amazon-oa-prep.pdf', 'Contains 50 most repeated array, string, and heap questions for HackerRank OA rounds.'
from public.company_preps where slug = 'amazon'
on conflict do nothing;

insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 1, 'Amazon OA Work Simulation Cheat Sheet.pdf', 'pdf', 'https://example.com/amazon-workstyle-simulation.pdf', 'Guidelines on how to respond to situational tasks matching Amazon Leadership principles.'
from public.company_preps where slug = 'amazon'
on conflict do nothing;

insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 3, 'System Design Basics - LLD Patterns.mp4', 'video', 'https://youtube.com/watch?v=lld-design-patterns', 'Video tutorial detailing Singleton, Factory, and Strategy patterns with Java code.'
from public.company_preps where slug = 'amazon'
on conflict do nothing;

insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 4, 'Amazon Leadership Principles Guide.pdf', 'pdf', 'https://example.com/amazon-leadership-star.pdf', 'STAR interview framework template containing samples for all 16 leadership principles.'
from public.company_preps where slug = 'amazon'
on conflict do nothing;


-- 6.2. GOOGLE SWE
insert into public.company_preps (slug, name, overview, difficulty, salary_range, eligibility_cgpa, eligibility_branches, eligibility_criteria, hiring_frequency, roles_hired, must_have_skills, good_to_have_skills, bonus_skills, package_value, active_rounds)
values (
  'google',
  'Google',
  'Google is a world-class technology company looking for SWE candidates with strong computer science foundations, algorithm optimizations, and Googleyness checks.',
  'Extreme',
  '₹22 - ₹60 LPA',
  8.0,
  array['Computer Science', 'Mathematics & Computing', 'Information Technology'],
  'Minimum 8.0 CGPA, no active backlogs, deep familiarity with complexity analysis.',
  'Annual',
  array['Software Engineer I (SWE L3)', 'SWE Intern', 'Site Reliability Engineer (SRE)'],
  array['Complex Data Structures (Graphs/Trees)', 'C++, Java, or Go', 'Time/Space Complexity Audit'],
  array['Operating Systems & Networks', 'Distributed Systems Basics', 'Googleyness & Leadership'],
  array['Machine Learning Foundations', 'System Architecture Design'],
  '₹22 - ₹60 LPA',
  4
) on conflict (slug) do nothing;

-- 6.2.2. Google Rounds
insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 1, 'Online Coding Assessment (OA)', '90 Minutes', 'Hard', 'Conducted on Google Form/Codecheck platform. Usually features 2 algorithmic questions on graphs, trees, or range queries.'
from public.company_preps where slug = 'google'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 2, 'Technical Phone Screen / Interview 1', '45 Minutes', 'Hard', 'Interviewer expects optimal solution directly. Talk through your thought process, write modular code, and cover edge cases (null inputs, overflows).'
from public.company_preps where slug = 'google'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 3, 'Technical Onsite Interview 2 & 3', '45 Minutes', 'Hard', 'Deeper algorithmic rounds focusing on Graph traversals, segment trees, trie structures, or dynamic programming.'
from public.company_preps where slug = 'google'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 4, 'Googleyness & Leadership Round', '45 Minutes', 'Medium', 'Assesses teamwork, alignment with core culture, comfort with ambiguity, intellectual humility, and ethical decision paths.'
from public.company_preps where slug = 'google'
on conflict (company_prep_id, round_number) do nothing;

-- 6.2.3. Google Resources
insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 1, 'Google OA Practice Questions.pdf', 'pdf', 'https://example.com/google-oa-dsa.pdf', 'Advanced coding problems with detailed solutions regarding trees and graphs.'
from public.company_preps where slug = 'google'
on conflict do nothing;

insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 2, 'Big O Notation Cheat Sheet.xlsx', 'sheet', 'https://example.com/big-o-notation-cheat-sheet.xlsx', 'Quick guide to reference standard operations complexities for standard DSA.'
from public.company_preps where slug = 'google'
on conflict do nothing;

insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 4, 'Googleyness Scenario Guide.pdf', 'pdf', 'https://example.com/googleyness-guidelines.pdf', 'Case-based guidelines regarding comfort with ambiguity and cooperative engineering.'
from public.company_preps where slug = 'google'
on conflict do nothing;


-- 6.3. TCS NINJA
insert into public.company_preps (slug, name, overview, difficulty, salary_range, eligibility_cgpa, eligibility_branches, eligibility_criteria, hiring_frequency, roles_hired, must_have_skills, good_to_have_skills, bonus_skills, package_value, active_rounds)
values (
  'tcs-ninja',
  'TCS Ninja',
  'TCS Ninja is the standard technology consulting track hired through the TCS National Qualifier Test (NQT), focusing on core coding and analytical foundations.',
  'Medium',
  '₹3.36 - ₹3.6 LPA',
  6.0,
  array['Computer Science', 'Information Technology', 'Software Engineering', 'Electronics', 'Electrical', 'Mechanical', 'Civil'],
  'Minimum 60% or 6.0 CGPA standard across 10th, 12th, and graduation with no active backlogs.',
  'Annual',
  array['Ninja System Engineer', 'Assistant System Engineer Trainee'],
  array['C, C++, or Java Basic programming', 'SQL/DBMS database models', 'Aptitude & logical math'],
  array['Operating Systems (Memory/Paging)', 'Software Engineering SDLC'],
  array['HTML/CSS/JS Basics'],
  '₹3.36 - ₹3.6 LPA',
  3
) on conflict (slug) do nothing;

-- 6.3.2. TCS Ninja Rounds
insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 1, 'National Qualifier Test (NQT)', '120 Minutes', 'Medium', 'Features Cognitive Foundation (aptitude, verbal, logic) and Technical Foundation sections, including basic loops and array parsing.'
from public.company_preps where slug = 'tcs-ninja'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 2, 'Technical Panel Interview', '30 Minutes', 'Medium', 'Expect basic questions on programming constructs, OOP principles (Inheritance, Polymorphism), and SQL statements (Select, Order By).'
from public.company_preps where slug = 'tcs-ninja'
on conflict (company_prep_id, round_number) do nothing;

insert into public.company_prep_rounds (company_prep_id, round_number, name, duration, difficulty, tips)
select id, 3, 'HR & MR Panel Interview', '20 Minutes', 'Easy', 'Behavioral assessment checking shift rotation comfort, relocations flexibility, document clearance, and communication.'
from public.company_preps where slug = 'tcs-ninja'
on conflict (company_prep_id, round_number) do nothing;

-- 6.3.3. TCS Ninja Resources
insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 1, 'TCS NQT Numerical Aptitude Practice Sheet.xlsx', 'sheet', 'https://example.com/tcs-nqt-aptitude.xlsx', '120+ solved numerical and quantitative questions on percentages, profit-loss, and ratios.'
from public.company_preps where slug = 'tcs-ninja'
on conflict do nothing;

insert into public.company_prep_resources (company_prep_id, round_number, name, type, url, description)
select id, 2, 'OOP Principles C++ Java Code Snippets.pdf', 'pdf', 'https://example.com/oop-constructs-cheat-sheet.pdf', 'Short PDF showing exact syntax comparisons for Inheritance and Abstraction in Java and C++.'
from public.company_preps where slug = 'tcs-ninja'
on conflict do nothing;
