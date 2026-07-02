-- Create learning_vault table for certificates management
CREATE TABLE IF NOT EXISTS public.learning_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  credential_id TEXT,
  verification_url TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'Pending',
  confidence_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for learning_vault
ALTER TABLE public.learning_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can operate on own learning vault" ON public.learning_vault
  FOR ALL USING (auth.uid()::text = user_id::text OR user_id = 'guest-user');

-- Create career_ledger table for tracking reward logs
CREATE TABLE IF NOT EXISTS public.career_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  pri_increase INTEGER NOT NULL,
  badge_unlocked TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for career_ledger
ALTER TABLE public.career_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own career ledger" ON public.career_ledger
  FOR ALL USING (auth.uid()::text = user_id::text OR user_id = 'guest-user');

-- Unique constraint on user_id + credential_id in learning_vault to prevent duplicate abuse
ALTER TABLE public.learning_vault ADD CONSTRAINT unique_user_credential UNIQUE (user_id, credential_id);

-- Reset and seed public.placement_missions table with rebalanced values
TRUNCATE TABLE public.placement_missions RESTART IDENTITY CASCADE;

-- Seed Category 1: Profile Missions (auto-verified)
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Complete Onboarding', 'Complete the student onboarding profile setup process.', 'profile', 'career', 50, 5, 1),
  ('00000000-0000-0000-0000-000000000002', 'Upload Resume', 'Scan and upload your placement resume to get an ATS assessment.', 'profile', 'career', 40, 5, 1),
  ('00000000-0000-0000-0000-000000000003', 'Add LinkedIn Profile', 'Link your professional LinkedIn account url to your profile.', 'profile', 'career', 15, 3, 1),
  ('00000000-0000-0000-0000-000000000004', 'Add GitHub Profile', 'Link your active GitHub profile url to your profile.', 'profile', 'career', 15, 3, 1),
  ('00000000-0000-0000-0000-000000000005', 'Create Portfolio', 'Link your personal web portfolio url to your profile.', 'profile', 'career', 75, 8, 1),
  ('00000000-0000-0000-0000-000000000006', 'Portfolio completion above 80%', 'Achieve a profile/portfolio completion rating of 80% or above.', 'profile', 'career', 75, 5, 1);

-- Seed Category 2: Learning Missions (requires proof / Learning Vault)
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000007', 'Upload DSA Certificate', 'Verify and upload a DSA course or practice certificate.', 'learning', 'career', 200, 10, 1),
  ('00000000-0000-0000-0000-000000000008', 'Upload Cloud Certificate', 'Verify and upload an AWS, GCP, or Azure Cloud certificate.', 'learning', 'career', 200, 15, 1),
  ('00000000-0000-0000-0000-000000000009', 'Upload SQL Certificate', 'Verify and upload a SQL or database systems certificate.', 'learning', 'career', 200, 10, 1),
  ('00000000-0000-0000-0000-000000000010', 'Complete Company Prep OS', 'Finish a complete company-specific preparation track.', 'learning', 'career', 150, 8, 1),
  ('00000000-0000-0000-0000-000000000011', 'Finish Project Advisor roadmap', 'Generate and complete a placement project architecture roadmap.', 'learning', 'career', 75, 10, 1),
  ('00000000-0000-0000-0000-000000000012', 'Resume ATS score above 80', 'Score 80 or above in the Resume Builder ATS scanner.', 'learning', 'career', 50, 8, 1),
  ('00000000-0000-0000-0000-000000000013', 'JD Match score above 80', 'Score 80 or above in a Job Description keywords match.', 'learning', 'career', 40, 5, 1);

-- Seed Category 3: Application Missions
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000014', 'Save First Job', 'Track your first job application inside the CRM.', 'applications', 'career', 10, 2, 1),
  ('00000000-0000-0000-0000-000000000015', 'Apply to 10 Jobs', 'Submit active applications to 10 different companies.', 'applications', 'career', 100, 5, 10),
  ('00000000-0000-0000-0000-000000000016', 'Apply to 25 Jobs', 'Submit active applications to 25 different companies.', 'applications', 'career', 250, 12, 25),
  ('00000000-0000-0000-0000-000000000017', 'Track First Interview', 'Progress to the interview stage in the CRM dashboard.', 'applications', 'career', 400, 8, 1),
  ('00000000-0000-0000-0000-000000000018', 'Reach HR Round', 'Advance to the final HR interview round for an application.', 'applications', 'career', 800, 15, 1),
  ('00000000-0000-0000-0000-000000000019', 'Receive Offer Letter', 'Get a verified job offer letter from an employer.', 'applications', 'career', 1500, 30, 1),
  ('00000000-0000-0000-0000-000000000020', 'Join Company', 'Accept the offer and officially join the company.', 'applications', 'career', 3000, 50, 1);

-- Seed Category 4: Community Missions
INSERT INTO public.placement_missions (id, title, description, category, mission_type, xp_reward, pri_reward, target_value) VALUES
  ('00000000-0000-0000-0000-000000000021', 'First Community Post', 'Write and publish your first forum post in the community hubs.', 'community', 'career', 15, 2, 1),
  ('00000000-0000-0000-0000-000000000022', 'First Helpful Answer', 'Post a helpful reply to a peer query in community discussion.', 'community', 'career', 10, 2, 1),
  ('00000000-0000-0000-0000-000000000023', 'Receive 10 Upvotes', 'Earn 10 upvotes on your shared posts/replies.', 'community', 'career', 50, 5, 10),
  ('00000000-0000-0000-0000-000000000024', 'Receive 50 Upvotes', 'Earn 50 upvotes on your shared posts/replies.', 'community', 'career', 150, 10, 50),
  ('00000000-0000-0000-0000-000000000025', 'Community Contributor Badge', 'Unlock the special Community Contributor milestone badge.', 'community', 'career', 250, 15, 1);

