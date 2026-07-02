-- Migration: Recruiter Networking OS 2.0

-- 1. Add new columns to public.recruiters
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS company_domain TEXT;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS recruiter_type TEXT CHECK (recruiter_type IN ('Technical Recruiter', 'Campus Recruiter', 'Talent Acquisition', 'Hiring Manager', 'Engineering Manager', 'HR Partner', 'Founder', 'Startup Recruiter'));
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100 NOT NULL;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Verified' NOT NULL; -- 'Verified', 'Likely Genuine', 'Suspicious', 'Potential Scam'
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS referral_sent_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS referral_accepted_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS referral_rejected_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS interview_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS offer_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS opportunity_score INTEGER DEFAULT 50 NOT NULL;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS opportunity_level TEXT DEFAULT 'Medium Opportunity' CHECK (opportunity_level IN ('High Opportunity', 'Medium Opportunity', 'Low Opportunity'));

-- 2. Ensure pipeline_stage check constraint covers the new stages
ALTER TABLE public.recruiters DROP CONSTRAINT IF EXISTS check_stage;
ALTER TABLE public.recruiters ADD CONSTRAINT check_stage CHECK (pipeline_stage IN ('Prospecting', 'Connected', 'Conversation Started', 'Relationship Building', 'Referral Requested', 'Referral Received', 'Application Submitted', 'Interview Opportunity', 'Offer Pipeline', 'Long-Term Network', 'Lead Found', 'Connection Sent', 'Follow Up', 'Hired', 'Lost'));
