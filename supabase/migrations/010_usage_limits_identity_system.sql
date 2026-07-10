-- ==========================================================
-- 010_usage_limits_identity_system.sql
-- ==========================================================

-- 1. User Subscriptions Table
create table if not exists public.user_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null unique,
  plan_type text not null default 'FREE' check (plan_type in ('FREE', 'PREMIUM', 'ADMIN')),
  status text not null default 'Active' check (status in ('Active', 'Expired', 'Cancelled')),
  starts_at timestamptz default timezone('utc'::text, now()) not null,
  expires_at timestamptz,
  monthly_reset_date timestamptz default (date_trunc('month', now() + interval '1 month')) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. User Usage Limits Table
create table if not exists public.user_usage_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references public.user_subscriptions(user_id) on delete cascade,
  feature_name text not null,
  monthly_limit integer not null,
  used_count integer default 0 not null,
  last_used timestamptz default timezone('utc'::text, now()) not null,
  reset_month text not null, -- format: 'YYYY-MM'
  unique (user_id, feature_name, reset_month)
);

-- 3. User Devices Table
create table if not exists public.user_devices (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  device_hash text not null,
  browser text,
  os text,
  location_country text,
  last_ip text,
  last_login timestamptz default timezone('utc'::text, now()) not null,
  is_trusted boolean default false not null,
  unique (user_id, device_hash)
);

-- 4. Security Events Table
create table if not exists public.security_events (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  event_type text not null check (event_type in (
    'Multiple Accounts', 'VPN', 'Too many logins', 'Device mismatch', 
    'Rate limit exceeded', 'Email verification failed', 'Account sharing suspicion'
  )),
  risk_score integer not null,
  ip_hash text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Feature Telemetry Table
create table if not exists public.feature_telemetry (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  feature_name text not null,
  plan_type text not null,
  execution_time_ms integer,
  ai_tokens integer default 0,
  estimated_cost_usd numeric(10,6) default 0.000000,
  device_hash text,
  ip_hash text,
  blocked_reason text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_subscriptions enable row level security;
alter table public.user_usage_limits enable row level security;
alter table public.user_devices enable row level security;
alter table public.security_events enable row level security;
alter table public.feature_telemetry enable row level security;

-- Configure RLS Security Policies
do $$
begin
  -- user_subscriptions policies
  if not exists (select 1 from pg_policies where tablename = 'user_subscriptions' and policyname = 'Allow read own subscription') then
    create policy "Allow read own subscription" on public.user_subscriptions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_subscriptions' and policyname = 'Allow admin write subscription') then
    create policy "Allow admin write subscription" on public.user_subscriptions for all using (true);
  end if;

  -- user_usage_limits policies
  if not exists (select 1 from pg_policies where tablename = 'user_usage_limits' and policyname = 'Allow read own limits') then
    create policy "Allow read own limits" on public.user_usage_limits for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_usage_limits' and policyname = 'Allow modify own limits') then
    create policy "Allow modify own limits" on public.user_usage_limits for all using (true);
  end if;

  -- user_devices policies
  if not exists (select 1 from pg_policies where tablename = 'user_devices' and policyname = 'Allow read own devices') then
    create policy "Allow read own devices" on public.user_devices for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_devices' and policyname = 'Allow write own devices') then
    create policy "Allow write own devices" on public.user_devices for all using (true);
  end if;

  -- security_events policies
  if not exists (select 1 from pg_policies where tablename = 'security_events' and policyname = 'Allow insert security events') then
    create policy "Allow insert security events" on public.security_events for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'security_events' and policyname = 'Allow read own security events') then
    create policy "Allow read own security events" on public.security_events for select using (true);
  end if;

  -- feature_telemetry policies
  if not exists (select 1 from pg_policies where tablename = 'feature_telemetry' and policyname = 'Allow insert telemetry') then
    create policy "Allow insert telemetry" on public.feature_telemetry for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'feature_telemetry' and policyname = 'Allow read own telemetry') then
    create policy "Allow read own telemetry" on public.feature_telemetry for select using (true);
  end if;
end $$;

-- 6. Trigger to automatically initialize a FREE subscription on user registration/profile creation
create or replace function public.handle_profile_subscription_init()
returns trigger as $$
begin
  insert into public.user_subscriptions (user_id, plan_type)
  values (new.user_id, 'FREE')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_profile_subscription_init();

-- 7. Populate existing profiles with FREE subscription if missing
insert into public.user_subscriptions (user_id, plan_type)
select user_id, 'FREE' from public.profiles
on conflict (user_id) do nothing;
