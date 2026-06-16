-- SQL Migration to set up AI Placement Copilot interactions tracking
-- 1. Create the Copilot Interactions table
CREATE TABLE IF NOT EXISTS public.copilot_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query text NOT NULL,
  response text NOT NULL,
  escalated boolean DEFAULT false NOT NULL,
  escalation_reason text,
  provider text NOT NULL,
  model text NOT NULL,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  cost numeric DEFAULT 0.0,
  response_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.copilot_interactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can operate on own copilot interactions" ON public.copilot_interactions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());
