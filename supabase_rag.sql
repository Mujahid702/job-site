-- SQL Migration to set up RAG Knowledge Base vectors using PGVector
-- 1. Enable PGVector and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Create the Knowledge Documents table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('roadmap', 'interview', 'playbook', 'guide')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(768),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- 4. Setup RLS Policies
CREATE POLICY "Anyone can select knowledge documents" ON public.knowledge_documents
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage knowledge documents" ON public.knowledge_documents
  FOR ALL USING (public.is_admin());

-- 5. Create HNSW Cosine Index for fast vector similarity searches
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_hnsw_idx 
  ON public.knowledge_documents USING hnsw (embedding vector_cosine_ops);

-- 6. Create RAG retrieval match function
CREATE OR REPLACE FUNCTION public.match_knowledge_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title,
    kd.category,
    kd.content,
    kd.metadata,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_documents kd
  WHERE (filter_category IS NULL OR kd.category = filter_category)
    AND 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
