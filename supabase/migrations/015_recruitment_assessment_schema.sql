-- Migration 015: Recruitment Assessment Ecosystem Schema
-- ==========================================================

-- 1. Create public.assessment_sessions
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.assessment_company_templates(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('Practice', 'Exam', 'Company')),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Abandoned')),
  started_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamptz,
  completed_at timestamptz,
  time_taken_seconds integer,
  score_percentage numeric(5,2),
  correct_count integer DEFAULT 0,
  incorrect_count integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  xp_gained integer DEFAULT 0
);

-- 2. Create public.assessment_session_answers
CREATE TABLE IF NOT EXISTS public.assessment_session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.assessment_options(id) ON DELETE SET NULL,
  submitted_answer text,
  is_correct boolean DEFAULT false NOT NULL,
  time_spent_seconds integer DEFAULT 0 NOT NULL,
  compiled_status text, -- Accepted, Wrong Answer, etc.
  passed_test_cases integer DEFAULT 0,
  total_test_cases integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_session_answers ENABLE ROW LEVEL SECURITY;

-- 4. Setup RLS Policies
DROP POLICY IF EXISTS "Users can operate own sessions" ON public.assessment_sessions;
CREATE POLICY "Users can operate own sessions" ON public.assessment_sessions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate own session answers" ON public.assessment_session_answers;
CREATE POLICY "Users can operate own session answers" ON public.assessment_session_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions 
      WHERE public.assessment_sessions.id = assessment_session_answers.session_id 
      AND public.assessment_sessions.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- 5. Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id ON public.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON public.assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_session_answers_session_id ON public.assessment_session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_session_answers_question_id ON public.assessment_session_answers(question_id);
