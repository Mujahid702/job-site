-- Migration: 006_context_engine_v2
-- Description: Sets up student_memories table schemas, unique indexes, and row-level security.

-- 1. Create table
create table if not exists public.student_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  memory_type text not null check (memory_type in ('permanent', 'long_term', 'working', 'episodic')),
  key text not null,
  value jsonb default '{}'::jsonb not null,
  confidence_score numeric default 1.0 not null,
  expires_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_memory_key unique (user_id, memory_type, key)
);

-- 2. Enable RLS
alter table public.student_memories enable row level security;

-- 3. RLS policies
drop policy if exists "Users can select own memories" on public.student_memories;
create policy "Users can select own memories" on public.student_memories
  for select using (auth.uid() = user_id);

drop policy if exists "Users can delete own memories" on public.student_memories;
create policy "Users can delete own memories" on public.student_memories
  for delete using (auth.uid() = user_id);

drop policy if exists "Users/Admins can modify own memories" on public.student_memories;
create policy "Users/Admins can modify own memories" on public.student_memories
  for all using (auth.uid() = user_id or public.is_admin());

-- 4. Create performance search index
create index if not exists student_memories_user_type_idx 
  on public.student_memories (user_id, memory_type);
