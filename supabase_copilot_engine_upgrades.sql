-- ==========================================
-- PRODUCTION-GRADE AI PLACEMENT COPILOT ENGINE
-- ==========================================

-- 1. Create AI Copilot Memory Layer
CREATE TABLE IF NOT EXISTS public.copilot_memory (
  user_id text PRIMARY KEY,
  strengths jsonb DEFAULT '[]'::jsonb NOT NULL,
  weaknesses jsonb DEFAULT '[]'::jsonb NOT NULL,
  repeated_mistakes jsonb DEFAULT '[]'::jsonb NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Dynamic Company Knowledge Base
CREATE TABLE IF NOT EXISTS public.company_knowledge (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company text NOT NULL,
  role text NOT NULL,
  hiring_process jsonb DEFAULT '[]'::jsonb NOT NULL, -- list of round milestones
  resources jsonb DEFAULT '[]'::jsonb NOT NULL, -- list of link URLs or PDF titles
  interview_experience text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company, role)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.copilot_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_knowledge ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies safely
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can read own copilot memory" ON public.copilot_memory;
    DROP POLICY IF EXISTS "Users can modify own copilot memory" ON public.copilot_memory;
    DROP POLICY IF EXISTS "Anyone can select company knowledge" ON public.company_knowledge;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can read own copilot memory" ON public.copilot_memory 
  FOR SELECT USING (true);

CREATE POLICY "Users can modify own copilot memory" ON public.copilot_memory 
  FOR ALL USING (true);

CREATE POLICY "Anyone can select company knowledge" ON public.company_knowledge 
  FOR SELECT USING (true);

-- ==========================================
-- SEED COMPANY INTEL DATA
-- ==========================================

INSERT INTO public.company_knowledge (company, role, hiring_process, resources, interview_experience) VALUES
('Deloitte', 'Data Analyst', 
 '[
   {"round": 1, "name": "Aptitude & SQL Online Test", "description": "30 MCQs on quantitative ability, logical reasoning, and complex SQL joins."},
   {"round": 2, "name": "Technical Interview", "description": "Questions on SQL window functions, DBMS normalization, Power BI dashboards, and Python arrays."},
   {"round": 3, "name": "HR Round", "description": "Behavioral round assessing candidate alignment, communication, and background checks."}
 ]'::jsonb,
 '[
   {"title": "SQL Joins Cheatsheet", "url": "/docs/sql-joins.pdf"},
   {"title": "Deloitte Prep Guide", "url": "/docs/deloitte-prep.pdf"}
 ]'::jsonb,
 'Focus heavily on GROUP BY, HAVING, and SQL window operations. The interviewer gave me a database schema of employees and departments and asked to find the second highest salary.'
),
('Google', 'SDE', 
 '[
   {"round": 1, "name": "Online Coding Challenge", "description": "2 hard algorithmic questions on graph traversal and dynamic programming."},
   {"round": 2, "name": "Technical Rounds (x3)", "description": "System design, trees, heaps, search algorithms, and algorithmic complexity tradeoffs."},
   {"round": 3, "name": "Googlyness Round", "description": "Google core values, behavioral alignment, leadership qualities."}
 ]'::jsonb,
 '[
   {"title": "DSA Cheat sheet", "url": "/docs/dsa-cheatsheet.pdf"},
   {"title": "System Design Handbook", "url": "/docs/system-design.pdf"}
 ]'::jsonb,
 'Deep dive into graph theory. Was asked to find shortest paths with custom constraints. Be prepared to explain your time and space complexity tradeoffs out loud.'
),
('Amazon', 'Full Stack Developer', 
 '[
   {"round": 1, "name": "Online Assessment (OA)", "description": "2 coding challenges and a workplace simulation mapping to Amazon Leadership Principles."},
   {"round": 2, "name": "Technical Loop (x2)", "description": "System architecture, REST API design patterns, data structure efficiency, and dynamic programming."},
   {"round": 3, "name": "Bar Raiser Interview", "description": "Strict verification of technical excellence and complete adherence to Leadership Principles."}
 ]'::jsonb,
 '[
   {"title": "Amazon Leadership Principles Review", "url": "/docs/amazon-lp.pdf"},
   {"title": "System Design Primer", "url": "/docs/system-design-primer.pdf"}
 ]'::jsonb,
 'Make sure you structure all behavioral answers in the STAR format (Situation, Task, Action, Result) and clearly state what leadership principles you applied.'
)
ON CONFLICT (company, role) DO UPDATE SET 
  hiring_process = excluded.hiring_process, 
  resources = excluded.resources, 
  interview_experience = excluded.interview_experience;
