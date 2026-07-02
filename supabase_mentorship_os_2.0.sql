-- Migration: Mentorship OS 2.0 (Admin Controlled Mentor Marketplace)

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- 1. Create public.mentors table
create table if not exists public.mentors (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  profile_photo text,
  headline text,
  bio text,
  company text not null,
  job_title text not null,
  years_experience integer not null default 0,
  skills text[] not null default '{}'::text[],
  specializations text[] not null default '{}'::text[],
  session_types text[] not null default '{}'::text[],
  pricing_type text not null default 'FREE' check (pricing_type in ('FREE', 'PAID', 'PREMIUM', 'INVITE ONLY')),
  session_price numeric not null default 0,
  currency text not null default 'USD',
  rating numeric not null default 5.0,
  review_count integer not null default 0,
  availability_status text not null default 'Available' check (availability_status in ('Available', 'Limited Availability', 'Booked', 'Vacation', 'Unavailable')),
  verified_status text not null default 'None' check (verified_status in ('Verified Badge', 'Official Badge', 'Industry Expert Badge', 'Alumni Badge', 'Community Mentor Badge', 'Partner Badge', 'Partner Mentor Badge', 'None')),
  featured_status boolean not null default false,
  linkedin_url text,
  portfolio_url text,
  email text,
  location text,
  languages text[] not null default '{"English"}'::text[],
  max_sessions_per_week integer not null default 5,
  active_status boolean not null default true,
  trust_score integer not null default 0 check (trust_score >= 0 and trust_score <= 100),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. Create public.mentor_slots table
create table if not exists public.mentor_slots (
  id uuid primary key default uuid_generate_v4(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  slot_date date not null,
  slot_time text not null, -- e.g. "10:00 AM"
  is_booked boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(mentor_id, slot_date, slot_time)
);

-- 3. Drop and rebuild public.mentor_bookings
drop table if exists public.mentor_bookings cascade;
create table public.mentor_bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  mentor_name text not null,
  session_type text not null,
  booking_date date not null,
  booking_time text not null, -- e.g. "10:00 AM"
  status text not null default 'Upcoming' check (status in ('Upcoming', 'Completed', 'Cancelled', 'Rescheduled')),
  price_paid numeric not null default 0,
  payment_method text not null default 'Free Access',
  notes text, -- student notes
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 4. Create public.mentor_reviews table with double-review protection
create table if not exists public.mentor_reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.mentor_bookings(id) on delete cascade unique, -- unique per booking ensures only one review!
  user_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  rating_communication integer not null check (rating_communication >= 1 and rating_communication <= 5),
  rating_knowledge integer not null check (rating_knowledge >= 1 and rating_knowledge <= 5),
  rating_helpfulness integer not null check (rating_helpfulness >= 1 and rating_helpfulness <= 5),
  rating_advice integer not null check (rating_advice >= 1 and rating_advice <= 5),
  rating_overall numeric not null check (rating_overall >= 1.0 and rating_overall <= 5.0),
  comment text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 5. Create public.mentor_session_notes table
create table if not exists public.mentor_session_notes (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.mentor_bookings(id) on delete cascade unique,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback text,
  roadmap jsonb default '{}'::jsonb, -- Learning Roadmap
  resources jsonb default '[]'::jsonb, -- Shared Resources
  questions jsonb default '[]'::jsonb, -- Interview Questions
  improvement_areas text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 6. Create public.mentor_demand_requests table
create table if not exists public.mentor_demand_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  help_needed text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Enable RLS on all tables
alter table public.mentors enable row level security;
alter table public.mentor_slots enable row level security;
alter table public.mentor_bookings enable row level security;
alter table public.mentor_reviews enable row level security;
alter table public.mentor_session_notes enable row level security;
alter table public.mentor_demand_requests enable row level security;

-- Setup RLS Policies

-- Mentors RLS Policies
create policy "Anyone can view active mentors" on public.mentors
  for select using (active_status = true);

create policy "Admins can manage mentors" on public.mentors
  for all using (public.is_admin());

-- Mentor Slots RLS Policies
create policy "Anyone can view slots" on public.mentor_slots
  for select using (true);

create policy "Admins can manage slots" on public.mentor_slots
  for all using (public.is_admin());

-- Bookings RLS Policies
create policy "Users can view own bookings" on public.mentor_bookings
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can create bookings" on public.mentor_bookings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own bookings" on public.mentor_bookings
  for update using (auth.uid() = user_id or public.is_admin());

create policy "Admins can delete bookings" on public.mentor_bookings
  for delete using (public.is_admin());

-- Reviews RLS Policies
create policy "Anyone can read reviews" on public.mentor_reviews
  for select using (true);

create policy "Users can write reviews for own completed bookings" on public.mentor_reviews
  for insert with check (auth.uid() = user_id);

create policy "Admins can delete reviews" on public.mentor_reviews
  for delete using (public.is_admin());

-- Session Notes RLS Policies
create policy "Users can view own session notes" on public.mentor_session_notes
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Admins/Mentors can manage session notes" on public.mentor_session_notes
  for all using (public.is_admin());

-- Demand Requests RLS Policies
create policy "Users can view own demand requests" on public.mentor_demand_requests
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can create demand requests" on public.mentor_demand_requests
  for insert with check (auth.uid() = user_id);

create policy "Admins can view and manage demand requests" on public.mentor_demand_requests
  for all using (public.is_admin());


-- Trust Score Calculation function & triggers
create or replace function public.calculate_mentor_trust_score(m_id uuid)
returns integer as $$
declare
  t_score integer := 0;
  linkedin_exists boolean;
  is_verified_company boolean;
  exp_years integer;
  avg_rating numeric;
  sessions_completed_count integer;
begin
  -- Get mentor details
  select 
    (linkedin_url is not null and linkedin_url <> ''),
    (verified_status in ('Verified Badge', 'Official Badge', 'Industry Expert Badge', 'Alumni Badge', 'Community Mentor Badge', 'Partner Badge', 'Partner Mentor Badge')),
    years_experience,
    rating
  into linkedin_exists, is_verified_company, exp_years, avg_rating
  from public.mentors
  where id = m_id;

  -- 1. LinkedIn Verification (+20 points)
  if linkedin_exists then
    t_score := t_score + 20;
  end if;

  -- 2. Company/Status Verification (+20 points)
  if is_verified_company then
    t_score := t_score + 20;
  end if;

  -- 3. Experience (+2 points per year, max 20)
  if exp_years is not null then
    t_score := t_score + least(exp_years * 2, 20);
  end if;

  -- 4. Ratings (up to 20 points based on overall rating, rating * 4)
  if avg_rating is not null then
    t_score := t_score + least(round(avg_rating * 4), 20);
  end if;

  -- 5. Completed Sessions (+2 points per session, max 20)
  select count(*)::integer into sessions_completed_count
  from public.mentor_bookings
  where mentor_id = m_id and status = 'Completed';

  t_score := t_score + least(sessions_completed_count * 2, 20);

  return least(greatest(t_score, 0), 100);
end;
$$ language plpgsql security definer;


-- Trigger to sync trust score and rating count when review is submitted/updated
create or replace function public.sync_mentor_reviews_trigger_func()
returns trigger as $$
declare
  m_id uuid;
  avg_r numeric;
  cnt_r integer;
begin
  if tg_op = 'DELETE' then
    m_id := old.mentor_id;
  else
    m_id := new.mentor_id;
  end if;

  -- Calculate average overall rating and count of reviews
  select coalesce(avg(rating_overall), 5.0), count(*)
  into avg_r, cnt_r
  from public.mentor_reviews
  where mentor_id = m_id;

  -- Update mentor stats
  update public.mentors
  set rating = round(avg_r, 2),
      review_count = cnt_r
  where id = m_id;

  -- Recalculate trust score
  update public.mentors
  set trust_score = public.calculate_mentor_trust_score(m_id)
  where id = m_id;

  return null;
end;
$$ language plpgsql security definer;

create trigger mentor_reviews_sync_trigger
after insert or update or delete on public.mentor_reviews
for each row execute function public.sync_mentor_reviews_trigger_func();


-- Trigger to sync trust score when booking status changes or mentor properties change
create or replace function public.sync_mentor_bookings_trigger_func()
returns trigger as $$
declare
  m_id uuid;
begin
  if tg_op = 'DELETE' then
    m_id := old.mentor_id;
  else
    m_id := new.mentor_id;
  end if;

  update public.mentors
  set trust_score = public.calculate_mentor_trust_score(m_id)
  where id = m_id;

  return null;
end;
$$ language plpgsql security definer;

create trigger mentor_bookings_sync_trigger
after insert or update or delete on public.mentor_bookings
for each row execute function public.sync_mentor_bookings_trigger_func();


-- Trigger to recalculate trust score when mentor itself changes (e.g. linkedin_url, years_experience)
create or replace function public.sync_mentor_profile_trigger_func()
returns trigger as $$
begin
  new.trust_score := public.calculate_mentor_trust_score(new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger mentor_profile_sync_trigger
before insert or update on public.mentors
for each row execute function public.sync_mentor_profile_trigger_func();
