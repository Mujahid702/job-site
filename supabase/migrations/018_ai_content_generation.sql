-- Migration: 018_ai_content_generation.sql
-- Description: Adds tracking schema for AI content generation, prompt versions, and validation records.

CREATE TABLE IF NOT EXISTS public.ai_generated_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  generation_model text NOT NULL,
  prompt_version text NOT NULL,
  validation_result jsonb NOT NULL, -- json containing validation checks
  admin_approved boolean DEFAULT false NOT NULL,
  generated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_generated_questions ENABLE ROW LEVEL SECURITY;

-- Setup Security Policies
DROP POLICY IF EXISTS "Allow admin full access to AI generated questions" ON public.ai_generated_questions;
CREATE POLICY "Allow admin full access to AI generated questions" ON public.ai_generated_questions
  FOR ALL USING (public.is_admin());
