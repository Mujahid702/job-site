-- Migration: Community Growth OS 2.0 & Referral Network Engine

-- 1. Drop old tables/constraints if they exist for clean upgrade
DROP TABLE IF EXISTS public.community_group_saves CASCADE;
DROP TABLE IF EXISTS public.community_group_members CASCADE;
DROP TABLE IF EXISTS public.community_groups CASCADE;
DROP TABLE IF EXISTS public.referral_reward_rules CASCADE;
DROP TABLE IF EXISTS public.referral_spam_flags CASCADE;
DROP TABLE IF EXISTS public.community_event_registrations CASCADE;
DROP TABLE IF EXISTS public.community_events CASCADE;
DROP TABLE IF EXISTS public.placement_ambassadors CASCADE;

-- 2. Create community_groups table
CREATE TABLE public.community_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT NOT NULL,
  group_description TEXT,
  group_category TEXT NOT NULL,
  platform_type TEXT NOT NULL,
  group_link TEXT NOT NULL,
  group_image TEXT,
  group_banner TEXT,
  group_status TEXT NOT NULL DEFAULT 'Active' CHECK (group_status IN ('Active', 'Disabled', 'Archived')),
  visibility TEXT NOT NULL DEFAULT 'Public' CHECK (visibility IN ('Public', 'Private', 'Unlisted')),
  display_order INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verification_status TEXT NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Verified', 'Official', 'Partner Community', 'Student Managed', 'Private', 'None')),
  unlock_min_profile_completion INTEGER NOT NULL DEFAULT 0,
  unlock_min_ats_score INTEGER NOT NULL DEFAULT 0,
  unlock_resume_uploaded BOOLEAN NOT NULL DEFAULT false,
  unlock_onboarding_completed BOOLEAN NOT NULL DEFAULT false
);

-- 3. Create community_group_members table
CREATE TABLE public.community_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_group UNIQUE (user_id, group_id)
);

-- 4. Create community_group_saves table
CREATE TABLE public.community_group_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_group_save UNIQUE (user_id, group_id)
);

-- 5. Expand referrals table structure
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS check_referral_status;
ALTER TABLE public.referrals ADD CONSTRAINT check_referral_status CHECK (
  status IN (
    'Invited', 'Joined', 'Activated', 'Converted', 
    'Invite Sent', 'Invite Opened', 'Account Created', 
    'Onboarding Completed', 'Activated User', 'Premium Conversion', 
    'Applications Submitted'
  )
);

ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS premium_converted_at TIMESTAMPTZ;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS application_submitted_at TIMESTAMPTZ;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false;

-- 6. Create referral_reward_rules table
CREATE TABLE public.referral_reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT UNIQUE NOT NULL,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Create referral_spam_flags table
CREATE TABLE public.referral_spam_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Suspicious' CHECK (severity IN ('Warning', 'Suspicious', 'Fraud')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Create community_events table
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('Hackathon', 'Hiring Drive', 'Referral Campaign', 'Workshop', 'Webinar', 'Mock Interview', 'Coding Contest')),
  event_date TIMESTAMPTZ NOT NULL,
  join_link TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'Public' CHECK (visibility IN ('Public', 'Private', 'Unlisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Create community_event_registrations table
CREATE TABLE public.community_event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Registered' CHECK (status IN ('Registered', 'Bookmarked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_event_registration UNIQUE (user_id, event_id)
);

-- 10. Create placement_ambassadors table
CREATE TABLE public.placement_ambassadors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  referred_count INTEGER NOT NULL DEFAULT 0,
  community_impact_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_spam_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_ambassadors ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS Policies
CREATE POLICY "Anyone can view community groups" ON public.community_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage community groups" ON public.community_groups
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can manage own memberships" ON public.community_group_members
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own saves" ON public.community_group_saves
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Anyone can view events" ON public.community_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON public.community_events
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can manage own event registrations" ON public.community_event_registrations
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can view own ambassador status" ON public.placement_ambassadors
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can apply for ambassador" ON public.placement_ambassadors
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage ambassadors" ON public.placement_ambassadors
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view reward rules" ON public.referral_reward_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage reward rules" ON public.referral_reward_rules
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view spam flags" ON public.referral_spam_flags
  FOR ALL USING (public.is_admin());

-- 13. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.community_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_saves_user ON public.community_group_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_user ON public.community_event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_user ON public.placement_ambassadors(user_id);

-- 14. Seed Data
-- Seed community groups
INSERT INTO public.community_groups (group_name, group_description, group_category, platform_type, group_link, featured, member_count, verification_status, display_order) VALUES
  ('Placement Updates Hub', 'Instant notifications on off-campus hiring drives and on-campus company updates.', 'Placement Updates', 'WhatsApp', 'https://chat.whatsapp.com/mock-placement-updates', true, 1850, 'Official', 1),
  ('DSA Practice Circle', 'Daily coding questions, pattern sheets, and peer troubleshooting boards.', 'DSA Preparation', 'Telegram', 'https://t.me/mock-dsa-preparation', true, 1420, 'Verified', 2),
  ('System Design Prep', 'Weekly mock design discussions covering distributed systems, databases, and microservices.', 'System Design', 'Discord', 'https://discord.gg/mock-system-design', false, 890, 'Verified', 3),
  ('Internship Alerts', 'Get direct alerts for summer/winter internship opportunities at top startups and enterprise giants.', 'Internships', 'WhatsApp', 'https://chat.whatsapp.com/mock-internships-updates', false, 950, 'Student Managed', 4),
  ('System Architect Circles', 'Advanced preparation group for tech leads and architect level roles. Locked for premium level candidates.', 'System Design', 'Discord', 'https://discord.gg/mock-vip-architects', false, 120, 'Partner Community', 5),
  ('Google Prep Network', 'Targeted SDE preparation for Google interviews. Requires unlocked placement readiness.', 'Placement Preparation', 'Telegram', 'https://t.me/mock-google-prep', true, 640, 'Official', 6),
  ('Startup Referral Club', 'Direct referrals into seed and Series A startups. Find founders and early team members.', 'Referral Network', 'Slack', 'https://slack.com/mock-startup-referrals', false, 480, 'Partner Community', 7);

-- Seed community events
INSERT INTO public.community_events (event_name, event_description, event_type, event_date, join_link) VALUES
  ('SDE Mock Interview Marathon', 'Get live feedback from senior engineering mentors in real-time SDE coding rounds.', 'Mock Interview', timezone('utc'::text, now() + interval '2 days'), 'https://meet.google.com/mock-mock-interview'),
  ('Summer Growth Hackathon 2026', 'Create scalable tech prototypes in 48 hours and win direct interview passes.', 'Hackathon', timezone('utc'::text, now() + interval '5 days'), 'https://hackathon.buggedbrain.com'),
  ('Deloitte & Accenture Prep Webinar', 'Strategy guidelines and QA assessments reviews for consultants candidates.', 'Webinar', timezone('utc'::text, now() + interval '1 days'), 'https://zoom.us/mock-consulting-webinar');

-- Seed referral reward rules
INSERT INTO public.referral_reward_rules (action, reward_xp, status) VALUES
  ('Registration', 10, 'Active'),
  ('Onboarding Completed', 20, 'Active'),
  ('Resume Uploaded', 30, 'Active'),
  ('First ATS Scan', 15, 'Active'),
  ('First Application', 25, 'Active'),
  ('Premium Upgrade', 100, 'Active')
ON CONFLICT (action) DO NOTHING;
