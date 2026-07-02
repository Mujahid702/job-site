-- SQL Migration to set up portfolio persistence and styling configurations

-- 1. Portfolio Templates Table (Managed by Admin, read by all users)
create table if not exists public.portfolio_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  theme text not null, -- Modern, Glassmorphism, Minimal, Developer, Startup Founder
  font_family text not null, -- Inter, Poppins, Roboto, Montserrat
  color_scheme text not null, -- Blue, Purple, Green, Dark
  sections_config jsonb default '{"hero": true, "about": true, "skills": true, "projects": true, "experience": true, "achievements": true, "certifications": true, "contact": true}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Portfolio Generations Table (Created by users, publicly readable)
create table if not exists public.portfolio_generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text not null,
  font_family text not null,
  color_scheme text not null,
  profile_image_url text,
  structured_schema jsonb not null, -- JSON containing HERO, ABOUT, SKILLS, EXPERIENCE, CERTIFICATIONS, ACHIEVEMENTS, CONTACT
  ai_enhanced boolean default false,
  published boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Portfolio Projects Table (Linked to portfolio, publicly readable)
create table if not exists public.portfolio_projects (
  id uuid primary key default uuid_generate_v4(),
  generation_id uuid references public.portfolio_generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  tech_stack text[],
  github_url text,
  live_url text,
  impact_score integer,
  problem_statement text,
  solution_description text,
  challenges_faced text,
  is_visible boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all tables
alter table public.portfolio_templates enable row level security;
alter table public.portfolio_generations enable row level security;
alter table public.portfolio_projects enable row level security;

-- 4. Set up RLS Policies

-- Portfolio Templates Policies
create policy "Allow public read access to active templates" on public.portfolio_templates
  for select using (is_active = true);

create policy "Allow admin write access to templates" on public.portfolio_templates
  for all using (public.is_admin());

-- Portfolio Generations Policies
create policy "Allow public read access to published generations" on public.portfolio_generations
  for select using (published = true or user_id = auth.uid() or public.is_admin());

create policy "Allow users to operate on own generations" on public.portfolio_generations
  for all using (user_id = auth.uid() or public.is_admin());

-- Portfolio Projects Policies
create policy "Allow public read access to portfolio projects" on public.portfolio_projects
  for select using (
    exists (
      select 1 from public.portfolio_generations g 
      where g.id = generation_id and (g.published = true or g.user_id = auth.uid())
    ) or user_id = auth.uid() or public.is_admin()
  );

create policy "Allow users to operate on own portfolio projects" on public.portfolio_projects
  for all using (user_id = auth.uid() or public.is_admin());

-- 5. Seed Default Portfolio Templates
insert into public.portfolio_templates (name, theme, font_family, color_scheme)
values
  ('Modern Indigo Poppins', 'Modern', 'Poppins', 'Blue')
on conflict (name) do nothing;

insert into public.portfolio_templates (name, theme, font_family, color_scheme)
values
  ('Glassmorphic Purple Inter', 'Glassmorphism', 'Inter', 'Purple')
on conflict (name) do nothing;

insert into public.portfolio_templates (name, theme, font_family, color_scheme)
values
  ('Developer Mono Dark', 'Developer', 'Roboto', 'Dark')
on conflict (name) do nothing;

insert into public.portfolio_templates (name, theme, font_family, color_scheme)
values
  ('Startup Green Montserrat', 'Startup Founder', 'Montserrat', 'Green')
on conflict (name) do nothing;

insert into public.portfolio_templates (name, theme, font_family, color_scheme)
values
  ('Minimalist Monochrome', 'Minimal', 'Inter', 'Dark')
on conflict (name) do nothing;
