-- Migration 016: Recruitment Assessment Ecosystem (Phase 2 Schema)
-- ==========================================================

-- 1. Drop existing tables if they exist to apply clean relational migrations
DROP TABLE IF EXISTS public.assessment_recommendations CASCADE;
DROP TABLE IF EXISTS public.assessment_performance CASCADE;
DROP TABLE IF EXISTS public.assessment_topic_scores CASCADE;
DROP TABLE IF EXISTS public.assessment_scores CASCADE;
DROP TABLE IF EXISTS public.sql_submissions CASCADE;
DROP TABLE IF EXISTS public.coding_submissions CASCADE;
DROP TABLE IF EXISTS public.assessment_answers CASCADE;
DROP TABLE IF EXISTS public.assessment_attempts CASCADE;
DROP TABLE IF EXISTS public.assessment_sessions CASCADE;
DROP TABLE IF EXISTS public.company_assessment_templates CASCADE;
DROP TABLE IF EXISTS public.assessment_template_questions CASCADE;
DROP TABLE IF EXISTS public.assessment_templates CASCADE;
DROP TABLE IF EXISTS public.sql_problems CASCADE;
DROP TABLE IF EXISTS public.coding_problems CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessment_subtopics CASCADE;
DROP TABLE IF EXISTS public.assessment_topics CASCADE;
DROP TABLE IF EXISTS public.assessment_categories CASCADE;

-- ==========================================================
-- CATALOG LAYER (Admin-Controlled Content)
-- ==========================================================

-- 1. Categories
CREATE TABLE public.assessment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Topics
CREATE TABLE public.assessment_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES public.assessment_categories(slug) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Subtopics
CREATE TABLE public.assessment_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.assessment_topics(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Questions
CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.assessment_topics(id) ON DELETE CASCADE,
  subtopic_id uuid REFERENCES public.assessment_subtopics(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  correct_answer_text text NOT NULL, -- matching option or reference value
  explanation text,
  hints jsonb DEFAULT '[]'::jsonb, -- array of strings
  difficulty text DEFAULT 'Medium' NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  marks integer DEFAULT 4 NOT NULL,
  negative_marks numeric DEFAULT 1.0 NOT NULL,
  is_published boolean DEFAULT true NOT NULL,
  type text DEFAULT 'MCQ' NOT NULL CHECK (type IN ('MCQ', 'Coding', 'SQL')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Coding Problems extension
CREATE TABLE public.coding_problems (
  question_id uuid PRIMARY KEY REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  starter_codes jsonb DEFAULT '{}'::jsonb NOT NULL, -- language -> template mapping
  sample_test_cases jsonb DEFAULT '[]'::jsonb NOT NULL, -- visible test case outputs
  time_limit_ms integer DEFAULT 5000 NOT NULL,
  memory_limit_mb integer DEFAULT 256 NOT NULL,
  constraints text,
  input_format text,
  output_format text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SQL Problems extension
CREATE TABLE public.sql_problems (
  question_id uuid PRIMARY KEY REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  sql_schema_seed text,
  correct_query text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Assessment Templates
CREATE TABLE public.assessment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 45 NOT NULL,
  passing_percentage integer DEFAULT 60 NOT NULL,
  randomize_questions boolean DEFAULT false NOT NULL,
  shuffle_options boolean DEFAULT false NOT NULL,
  visibility text DEFAULT 'Free' NOT NULL CHECK (visibility IN ('Free', 'Premium')),
  attempt_limit integer DEFAULT 3,
  is_published boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Assessment Template Questions junction
CREATE TABLE public.assessment_template_questions (
  template_id uuid NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  points integer DEFAULT 4 NOT NULL,
  PRIMARY KEY (template_id, question_id)
);

-- 9. Company Assessment Templates extension
CREATE TABLE public.company_assessment_templates (
  template_id uuid PRIMARY KEY REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  target_role text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- TRANSACTION / USER EXECUTION LAYER (Student-Specific)
-- ==========================================================

-- 10. Assessment Sessions
CREATE TABLE public.assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.assessment_templates(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('Practice', 'Exam', 'Company')),
  status text DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Completed', 'Abandoned')),
  started_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamptz,
  score_percentage numeric(5,2),
  passed boolean,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Assessment Attempts (tracks unique run attempts within session)
CREATE TABLE public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamptz,
  is_completed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Assessment Answers logs
CREATE TABLE public.assessment_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  selected_option_id uuid, -- for MCQ questions
  answer_text text, -- user typed answer or query
  is_correct boolean DEFAULT false NOT NULL,
  time_spent_seconds integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Coding Submissions execution logs
CREATE TABLE public.coding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_content text NOT NULL,
  language text NOT NULL,
  status text NOT NULL CHECK (status IN ('Accepted', 'Wrong Answer', 'Compile Error', 'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded')),
  execution_time_ms integer,
  memory_used_kb integer,
  passed_test_cases integer NOT NULL,
  total_test_cases integer NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. SQL Submissions execution logs
CREATE TABLE public.sql_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_query text NOT NULL,
  status text NOT NULL CHECK (status IN ('Accepted', 'Wrong Answer', 'Compile Error')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- METRICS / SCORING & ANALYTICS LAYER (Student-Specific)
-- ==========================================================

-- 15. Assessment Scores
CREATE TABLE public.assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  score_percentage numeric(5,2) NOT NULL,
  passed boolean NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Assessment Topic Scores (Aggregate rolling solved progress per user per topic)
CREATE TABLE public.assessment_topic_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.assessment_topics(id) ON DELETE CASCADE,
  total_solved integer DEFAULT 0 NOT NULL,
  correct_solved integer DEFAULT 0 NOT NULL,
  accuracy_percentage numeric(5,2) DEFAULT 0.00 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_assessment_user_topic UNIQUE (user_id, topic_id)
);

-- 17. Assessment Performance trends (Time series aggregations per day)
CREATE TABLE public.assessment_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT current_date NOT NULL,
  total_time_spent_seconds integer DEFAULT 0 NOT NULL,
  average_accuracy_percentage numeric(5,2) DEFAULT 0.00 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- 18. Assessment Recommendations
CREATE TABLE public.assessment_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_topic_id uuid NOT NULL REFERENCES public.assessment_topics(id) ON DELETE CASCADE,
  priority text DEFAULT 'Medium' NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  reason text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ==========================================================

-- A. Catalog tables are public-read (published/active items only) but write is locked to admins
ALTER TABLE public.assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_assessment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select categories" ON public.assessment_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can select topics" ON public.assessment_topics FOR SELECT USING (true);
CREATE POLICY "Anyone can select subtopics" ON public.assessment_subtopics FOR SELECT USING (true);
CREATE POLICY "Anyone can select published questions" ON public.assessment_questions FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can select coding extensions" ON public.coding_problems FOR SELECT USING (true);
CREATE POLICY "Anyone can select sql extensions" ON public.sql_problems FOR SELECT USING (true);
CREATE POLICY "Anyone can select published templates" ON public.assessment_templates FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can select template questions" ON public.assessment_template_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can select company templates" ON public.company_assessment_templates FOR SELECT USING (true);

-- B. Student transaction & score tables are STRICTLY isolated by user_id
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_topic_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_recommendations ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Sessions isolation" ON public.assessment_sessions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Attempts policies
CREATE POLICY "Attempts isolation" ON public.assessment_attempts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Answers policies (linked to user-isolated attempts)
CREATE POLICY "Answers isolation" ON public.assessment_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = assessment_answers.attempt_id
      AND (a.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Submissions policies
CREATE POLICY "Coding submissions isolation" ON public.coding_submissions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "SQL submissions isolation" ON public.sql_submissions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Scores policies
CREATE POLICY "Scores isolation" ON public.assessment_scores
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Topic scores isolation" ON public.assessment_topic_scores
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Performance analytics policies
CREATE POLICY "Performance isolation" ON public.assessment_performance
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Recommendations policies
CREATE POLICY "Recommendations isolation" ON public.assessment_recommendations
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================================
-- INDEXING
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.assessment_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_template_questions_q ON public.assessment_template_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON public.assessment_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON public.assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_coding_sub_user ON public.coding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_sub_user ON public.sql_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user ON public.assessment_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_scores_user ON public.assessment_topic_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_user ON public.assessment_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_recs_user ON public.assessment_recommendations(user_id);

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- Seed Categories
INSERT INTO public.assessment_categories (name, slug, description) VALUES
('Quantitative Aptitude', 'aptitude', 'Mathematics, arithmetic, algebraic operations, word puzzles and data interpretation.'),
('Logical Reasoning', 'logical', 'Deductive reasoning, pattern analysis, blood relations, seating arrangements and puzzles.'),
('Verbal Ability', 'verbal', 'Sentence syntax correction, grammar, reading comprehension, idioms and vocabulary.'),
('SQL Assessments', 'sql', 'Relational query execution, window aggregates, group filtrations and joining patterns.'),
('Coding Assessments', 'coding', 'Data structures, algorithm complexity optimization, dynamic scripting and traversal operations.')
ON CONFLICT (slug) DO UPDATE SET name = excluded.name, description = excluded.description;

-- Seed Topics for Categories
INSERT INTO public.assessment_topics (category_slug, name, slug) VALUES
('aptitude', 'Percentage', 'apt-percentage'),
('aptitude', 'Profit & Loss', 'apt-profit-loss'),
('aptitude', 'Ratio', 'apt-ratio'),
('aptitude', 'Time & Work', 'apt-time-work'),
('aptitude', 'Average', 'apt-average'),
('sql', 'SQL Window Functions', 'sql-window-functions'),
('coding', 'Array Operations', 'code-arrays'),
('coding', 'String Manipulation', 'code-strings')
ON CONFLICT (slug) DO NOTHING;
