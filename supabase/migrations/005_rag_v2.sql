-- Migration: 005_rag_v2
-- Description: Upgrades the RAG 1.0 vectors schema to support multi-dimensional hybrid filtering, structured placement metadata, and evaluation telemetry.

-- 1. Drop check constraint on categories to support modular domains
alter table public.knowledge_documents drop constraint if exists knowledge_documents_category_check;

-- 2. Add metadata columns for metadata matching and analytics
alter table public.knowledge_documents add column if not exists subcategory text;
alter table public.knowledge_documents add column if not exists company text;
alter table public.knowledge_documents add column if not exists role text;
alter table public.knowledge_documents add column if not exists difficulty text;
alter table public.knowledge_documents add column if not exists technology text;
alter table public.knowledge_documents add column if not exists confidence_score numeric default 1.0;
alter table public.knowledge_documents add column if not exists verified_by text default 'System Expert';
alter table public.knowledge_documents add column if not exists active boolean default true;
alter table public.knowledge_documents add column if not exists review_date timestamptz default now() + interval '180 days';
alter table public.knowledge_documents add column if not exists expiry_date timestamptz default now() + interval '365 days';
alter table public.knowledge_documents add column if not exists popularity integer default 0;
alter table public.knowledge_documents add column if not exists version integer default 1;

-- 3. Create RAG Retrieval Evaluation Telemetry Table
create table if not exists public.rag_retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  results_count integer default 0,
  average_similarity numeric default 0.0,
  latency_ms integer default 0,
  grounding_quality numeric default 1.0,
  hallucination_detected boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS policies on telemetry logs
alter table public.rag_retrieval_logs enable row level security;
drop policy if exists "Allow admins to read retrieval logs" on public.rag_retrieval_logs;
create policy "Allow admins to read retrieval logs" on public.rag_retrieval_logs
  for all using (public.is_admin());

drop policy if exists "Anyone can insert retrieval logs" on public.rag_retrieval_logs;
create policy "Anyone can insert retrieval logs" on public.rag_retrieval_logs
  for insert with check (true);

-- 4. Create Hybrid Vector Search Match Function
create or replace function public.match_knowledge_documents_v2 (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category text default null,
  filter_company text default null,
  filter_role text default null,
  filter_difficulty text default null,
  filter_technology text default null
)
returns table (
  id uuid,
  title text,
  category text,
  content text,
  metadata jsonb,
  similarity float,
  confidence_score numeric,
  popularity integer,
  review_date timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    kd.id,
    kd.title,
    kd.category,
    kd.content,
    kd.metadata,
    1 - (kd.embedding <=> query_embedding) as similarity,
    kd.confidence_score,
    kd.popularity,
    kd.review_date
  from public.knowledge_documents kd
  where kd.active = true
    and (filter_category is null or kd.category = filter_category)
    and (filter_company is null or kd.company = filter_company or kd.company = 'General')
    and (filter_role is null or kd.role = filter_role or kd.role = 'General')
    and (filter_difficulty is null or kd.difficulty = filter_difficulty or kd.difficulty = 'General')
    and (filter_technology is null or kd.technology = filter_technology or kd.technology = 'General')
    and 1 - (kd.embedding <=> query_embedding) > match_threshold
  order by (1 - (kd.embedding <=> query_embedding)) * 0.7 + (kd.confidence_score * 0.2) + (kd.popularity * 0.1 / 1000) desc
  limit match_count;
end;
$$;
