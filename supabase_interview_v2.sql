-- Migration: AI Mock Interview OS 2.0 Database Tables

-- 1. Create Subscription Tiers Table
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  daily_interview_minutes integer DEFAULT 10 NOT NULL,
  ai_followups_limit integer DEFAULT 2 NOT NULL,
  advanced_round_limit integer DEFAULT 1 NOT NULL,
  voice_sessions_limit integer DEFAULT 1 NOT NULL,
  resume_based_interviews boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Subscription Tiers
INSERT INTO public.subscription_tiers (id, name, daily_interview_minutes, ai_followups_limit, advanced_round_limit, voice_sessions_limit, resume_based_interviews)
VALUES
  ('FREE', 'Free tier Candidate', 10, 2, 1, 1, false),
  ('PRO', 'Professional tier Developer', 30, 10, 5, 5, true),
  ('PREMIUM', 'Unlimited Placement Elite', 1440, 9999, 9999, 9999, true)
ON CONFLICT (id) DO UPDATE
SET daily_interview_minutes = excluded.daily_interview_minutes,
    ai_followups_limit = excluded.ai_followups_limit,
    advanced_round_limit = excluded.advanced_round_limit,
    voice_sessions_limit = excluded.voice_sessions_limit,
    resume_based_interviews = excluded.resume_based_interviews;

-- 2. Create Interview Question Bank Table
CREATE TABLE IF NOT EXISTS public.interview_question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  company text DEFAULT 'General' NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  round_type text NOT NULL,
  question text NOT NULL,
  answer_guidelines text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[] NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Interview Sessions Table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text DEFAULT 'General' NOT NULL,
  role text NOT NULL,
  difficulty text NOT NULL,
  round_type text NOT NULL,
  duration_seconds integer DEFAULT 0 NOT NULL,
  overall_score integer DEFAULT 0 NOT NULL,
  started_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamptz
);

-- 4. Create Interview Answers Table
CREATE TABLE IF NOT EXISTS public.interview_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  user_answer text NOT NULL,
  difficulty text NOT NULL,
  scores jsonb NOT NULL, -- Holds: accuracy, communication, confidence, depth, STAR, problem-solving, overall
  feedback jsonb NOT NULL, -- Holds: strengths, weaknesses, model answer
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to subscription tiers" ON public.subscription_tiers
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to interview question bank" ON public.interview_question_bank
  FOR SELECT USING (true);

CREATE POLICY "Allow users to manage own interview sessions" ON public.interview_sessions
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Allow users to manage own interview answers" ON public.interview_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE public.interview_sessions.id = public.interview_answers.session_id
      AND (public.interview_sessions.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Seed Target Question Bank Samples
INSERT INTO public.interview_question_bank (role, difficulty, round_type, question, answer_guidelines, tags)
VALUES
  -- Data Analyst (Beginner)
  ('Data Analyst', 'Beginner', 'Technical', 'What is Excel and how does it differ from a database?', 'Explain grid structure, local vs centralized storage, and basic calculation limits.', ARRAY['Excel', 'Fundamentals']),
  ('Data Analyst', 'Beginner', 'Technical', 'What is SQL and why is it used?', 'Explain Structured Query Language and database queries.', ARRAY['SQL', 'Database']),
  ('Data Analyst', 'Beginner', 'Technical', 'What is the difference between WHERE and HAVING clauses in SQL?', 'Explain filtering before aggregation (WHERE) vs filtering after aggregation (HAVING).', ARRAY['SQL', 'Aggregate']),
  ('Data Analyst', 'Beginner', 'Technical', 'What is Power BI and why is it useful?', 'Explain data visualization, dashboards, and reporting.', ARRAY['Power BI', 'Visualization']),
  ('Data Analyst', 'Beginner', 'Technical', 'What is a Primary Key in a database table?', 'Explain uniqueness constraint, null validation, and index indexing.', ARRAY['SQL', 'Database']),

  -- Data Analyst (Intermediate)
  ('Data Analyst', 'Intermediate', 'Technical', 'How would you optimize a slow running SQL query with join filters?', 'Explain execution plans, column indexes, avoiding wildcards (*), and filtering early.', ARRAY['SQL', 'Optimization']),
  ('Data Analyst', 'Intermediate', 'Technical', 'Explain your dashboard data pipeline and refresh architecture.', 'Discuss scheduled refreshes, gateway settings, data sizing, and storage models.', ARRAY['Power BI', 'Pipeline']),

  -- Data Analyst (Advanced)
  ('Data Analyst', 'Advanced', 'Technical', 'How would you optimize a Power BI dashboard handling 20 million rows with complex DAX measures?', 'Discuss DirectQuery vs Import mode, reducing calculated columns, optimizing DAX variables, and dimensional modeling.', ARRAY['Power BI', 'DAX', 'Performance']),
  ('Data Analyst', 'Advanced', 'System Design', 'Design an analytics data ingestion pipeline tracking clickstream events.', 'Discuss message queues, processing hubs (Kafka, Spark), warehousing (BigQuery, Redshift), and BI metrics.', ARRAY['System Design', 'Clickstream']),

  -- Software Engineer (Beginner)
  ('Software Engineer', 'Beginner', 'Technical', 'What is the difference between an Array and a Linked List?', 'Explain contiguous memory allocation, insertion speeds, and indexing times.', ARRAY['DSA', 'Fundamentals']),
  ('Software Engineer', 'Beginner', 'Technical', 'What is Object-Oriented Programming (OOP) and its pillars?', 'Explain encapsulation, abstraction, inheritance, and polymorphism.', ARRAY['OOP', 'Fundamentals']),
  ('Software Engineer', 'Beginner', 'Technical', 'What is the difference between a process and a thread?', 'Discuss memory space sharing, scheduling weights, and isolation controls.', ARRAY['OS', 'Concurrency']),

  -- Software Engineer (Intermediate)
  ('Software Engineer', 'Intermediate', 'Technical', 'How does indexing in a PostgreSQL database speed up queries?', 'Discuss B-Trees, logarithmic search times, index maintenance costs on insert/update.', ARRAY['Database', 'Postgres']),
  ('Software Engineer', 'Intermediate', 'Technical', 'Explain when you would use REST vs GraphQL APIs in system communications.', 'Discuss over-fetching/under-fetching, HTTP caching, and schema specifications.', ARRAY['APIs', 'GraphQL']),

  -- Software Engineer (Advanced)
  ('Software Engineer', 'Advanced', 'System Design', 'Design a scalable, highly available rate limiter for a public API gateway.', 'Discuss token bucket algorithm, Redis caching, microsecond locks, and failover options.', ARRAY['System Design', 'Rate Limiter']),
  ('Software Engineer', 'Advanced', 'Technical', 'Explain how you would resolve a deadlock condition in a concurrent database query sequence.', 'Discuss locks ordering, transaction isolation levels, deadlock prevention threads, and retry controls.', ARRAY['Concurrency', 'Locking']),

  -- HR / Behavioral (Beginner)
  ('Software Engineer', 'Beginner', 'HR Round', 'Why do you want to work at this company?', 'Discuss company projects, goals, values, and alignment with target engineering roles.', ARRAY['Motivation', 'HR']),
  ('Software Engineer', 'Beginner', 'Behavioral', 'Tell me about a time you worked on a group project and faced a conflict.', 'Structure response with Situation, Task, Action, and Result (STAR method).', ARRAY['Conflict', 'STAR']),

  -- Full Stack (Beginner)
  ('Full Stack Developer', 'Beginner', 'Technical', 'What is the difference between Client-Side Rendering (CSR) and Server-Side Rendering (SSR)?', 'Discuss SEO indexing speed, initial page loads, and javascript bundles.', ARRAY['CSR', 'SSR', 'Nextjs']),
  
  -- Frontend (Beginner)
  ('Frontend Developer', 'Beginner', 'Technical', 'Explain React lifecycle hooks and useEffect hooks.', 'Discuss mounting, updating, unmounting side-effects, and dependencies arrays.', ARRAY['React', 'Hooks']),
  
  -- Backend (Beginner)
  ('Backend Developer', 'Beginner', 'Technical', 'Explain how sessions and cookies work in authorization pipelines.', 'Discuss stateless JWTs vs stateful server sessions stored in memory databases.', ARRAY['Security', 'Auth'])
ON CONFLICT DO NOTHING;
