-- SQL Migration to set up Placement Mission Engine tables, RLS policies, and seed data

-- Create placement_missions table
CREATE TABLE IF NOT EXISTS public.placement_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'dsa', 'applications', 'linkedin', 'resume', 'roadmap', 'portfolio', 'pri', etc.
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'career')),
  xp_reward INTEGER NOT NULL DEFAULT 10,
  pri_reward INTEGER NOT NULL DEFAULT 2,
  target_value INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_missions table
CREATE TABLE IF NOT EXISTS public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.placement_missions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, mission_id)
);

-- Create user_xp table
CREATE TABLE IF NOT EXISTS public.user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Modify profiles to include badges (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='badges'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN badges TEXT[] DEFAULT '{}'::TEXT[];
  END IF;
END $$;

-- Modify placement_readiness to include mission_bonus_score (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='placement_readiness' AND column_name='mission_bonus_score'
  ) THEN
    ALTER TABLE public.placement_readiness ADD COLUMN mission_bonus_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.placement_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
DROP POLICY IF EXISTS "Anyone can read active placement missions" ON public.placement_missions;
CREATE POLICY "Anyone can read active placement missions" ON public.placement_missions
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage placement missions" ON public.placement_missions;
CREATE POLICY "Admins can manage placement missions" ON public.placement_missions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own user_missions" ON public.user_missions;
CREATE POLICY "Users can operate on own user_missions" ON public.user_missions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can operate on own user_xp" ON public.user_xp;
CREATE POLICY "Users can operate on own user_xp" ON public.user_xp
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Seed initial master missions
INSERT INTO public.placement_missions (title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('Solve 2 DSA Problems', 'Practice and solve 2 DSA coding challenges.', 'dsa', 'daily', 20, 2, 2),
  ('Apply to 1 Company', 'Track at least 1 job application in your CRM.', 'applications', 'daily', 15, 3, 1),
  ('Complete ATS Scan', 'Scan a resume to inspect keyword match.', 'resume', 'daily', 15, 5, 1),
  ('Attend a Mock Interview', 'Run an AI mock interview evaluation.', 'interviews', 'daily', 20, 6, 1),
  
  ('Complete 10 DSA Problems', 'Complete 10 DSA questions throughout the week.', 'dsa', 'weekly', 100, 10, 10),
  ('Apply to 10 Jobs', 'Submit and log 10 applications in the CRM.', 'applications', 'weekly', 80, 15, 10),
  ('Build one project feature', 'Register and evaluate a project blueprint.', 'projects', 'weekly', 50, 5, 1),
  ('Attend one mock interview', 'Perform a full mock interview training session.', 'interviews', 'weekly', 75, 6, 1),
  
  ('Reach ATS Score 80+', 'Achieve an ATS scoring threshold of 80+.', 'resume', 'career', 200, 15, 80),
  ('Complete Full Stack Roadmap', 'Complete the core Full Stack Developer Roadmap.', 'roadmap', 'career', 300, 20, 1),
  ('Upload Portfolio', 'Attach a live portfolio URL and GitHub profile.', 'portfolio', 'career', 150, 10, 1),
  ('Reach PRI Score 70+', 'Achieve a Placement Readiness Index of 70+.', 'pri', 'career', 250, 15, 70),
  ('Complete 100 Applications', 'Log 100 active jobs tracked inside CRM.', 'applications', 'career', 500, 30, 100)
ON CONFLICT DO NOTHING;
