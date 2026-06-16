-- SQL Migration to set up WhatsApp Growth Engine persistent tables, RLS policies, and seed data

-- 0. Extend profiles table to support referral tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 1. Create Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Joined',
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_referral_status CHECK (status IN ('Invited', 'Joined', 'Activated', 'Converted'))
);

-- 2. Create WhatsApp Campaigns Table
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  message_template TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  target_group TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_campaign_status CHECK (status IN ('Draft', 'Scheduled', 'Sent')),
  CONSTRAINT check_campaign_type CHECK (type IN ('Placement Drives', 'Referral Campaigns', 'Hackathons', 'Community Growth', 'Premium Upsells'))
);

-- 3. Create Campaign Analytics Table
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID UNIQUE NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  sent_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  join_count INTEGER DEFAULT 0,
  registration_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Community Groups Table
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  link TEXT NOT NULL,
  member_count INTEGER DEFAULT 0,
  activity_status TEXT DEFAULT 'Active',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_platform CHECK (platform IN ('WhatsApp', 'Telegram', 'Discord'))
);

-- 5. Create User Streaks Table
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  streak_level TEXT DEFAULT '7 Days',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Leaderboard Snapshots Table
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies (User isolation & Admin bypass)
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR ALL USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id OR public.is_admin());

CREATE POLICY "Anyone can view community groups" ON public.community_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage community groups" ON public.community_groups
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can manage own streaks" ON public.user_streaks
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Anyone can view campaigns and analytics" ON public.whatsapp_campaigns
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage campaigns" ON public.whatsapp_campaigns
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view campaign metrics" ON public.campaign_analytics
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage campaign metrics" ON public.campaign_analytics
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view leaderboard snapshots" ON public.leaderboard_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage snapshots" ON public.leaderboard_snapshots
  FOR ALL USING (public.is_admin());

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.whatsapp_campaigns(status);

-- Seed Default Predefined Community Groups
INSERT INTO public.community_groups (name, description, platform, link, member_count, activity_status, category) VALUES
('Placement Community', 'Core placement announcements group for news, deadlines, and guidelines.', 'WhatsApp', 'https://chat.whatsapp.com/mock-placement-community', 1240, 'High Activity', 'Placement Updates'),
('Placement Updates Group', 'Daily feeds of top software engineering roles and hiring posts.', 'WhatsApp', 'https://chat.whatsapp.com/mock-placement-updates', 980, 'Active', 'Placement Updates'),
('Preparation Group', 'Discussion group for DSA questions, mock interview prep, and roadmaps.', 'WhatsApp', 'https://chat.whatsapp.com/mock-prep-discuss', 740, 'High Activity', 'Preparation'),
('Hackathon Group', 'Find hackathon teams, share ideas, and coordinate project submissions.', 'WhatsApp', 'https://chat.whatsapp.com/mock-hackathons', 420, 'Active', 'Hackathons'),
('Internship Group', 'Dedicated channel distributing fresh summer/winter internship leads.', 'Telegram', 'https://t.me/mock-internships', 1560, 'Active', 'Internships'),
('Referral Network', 'Connect with university seniors and corporate mentors for active referrals.', 'Discord', 'https://discord.gg/mock-placement-referrals', 2150, 'High Activity', 'Referral Network');
