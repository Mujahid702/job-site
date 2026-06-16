-- SQL Migration to set up AI Gateway usage and cost tracking
-- 1. Create the AI Usage Logs table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model text NOT NULL,
  task_type text NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost numeric(12, 8) NOT NULL DEFAULT 0.0,
  response_time_ms integer NOT NULL DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Admins can select ai usage logs" ON public.ai_usage_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Enable insert for server side logs" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (true);
