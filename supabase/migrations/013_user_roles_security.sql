-- supabase/migrations/013_user_roles_security.sql
-- 1. Create user_roles table
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  role text not null check (role in ('user', 'admin', 'super_admin')),
  created_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.user_roles enable row level security;

-- Policies for public.user_roles
-- Users can only read their own role
drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role" on public.user_roles
  for select using (auth.uid() = user_id);

-- Admins can view all user roles
drop policy if exists "Admins can select user roles" on public.user_roles;
create policy "Admins can select user roles" on public.user_roles
  for select using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and (role = 'admin' or role = 'super_admin')
    )
  );

-- Populate table with existing administrators to avoid service interruption
insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users
where email in ('mujjumujahid1992@gmail.com', 'buggedbrain2026@gmail.com')
on conflict (user_id) do update set role = 'super_admin';

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set role = 'admin';

-- 2. Update is_admin() function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and (role = 'admin' or role = 'super_admin')
  );
end;
$$ language plpgsql security definer;
