-- SQL Migration to set up Recruiter CRM database schemas and RLS policies

-- 1. Create Recruiters Table
CREATE TABLE IF NOT EXISTS public.recruiters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  designation TEXT,
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  hiring_roles TEXT, -- Description of roles they hire for
  relationship_strength TEXT DEFAULT 'Cold',
  pipeline_stage TEXT DEFAULT 'Lead Found',
  last_interaction TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_relationship CHECK (relationship_strength IN ('Cold', 'Connected', 'Messaged', 'Responded', 'Referral Possible', 'Strong Connection')),
  CONSTRAINT check_stage CHECK (pipeline_stage IN ('Lead Found', 'Connection Sent', 'Connected', 'Conversation Started', 'Follow Up', 'Referral Requested', 'Referral Received', 'Interview Opportunity', 'Hired', 'Lost'))
);

-- 2. Create Recruiter Activities Table
CREATE TABLE IF NOT EXISTS public.recruiter_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- e.g., 'Connection Sent', 'Message Sent', 'Reply Received', 'Referral Requested', 'Referral Approved', 'Interview Scheduled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Recruiter Follow-ups Table
CREATE TABLE IF NOT EXISTS public.recruiter_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followup_date TIMESTAMPTZ NOT NULL,
  message TEXT,
  reminder BOOLEAN DEFAULT TRUE,
  priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'))
);

-- 4. Create Recruiter Templates Table
CREATE TABLE IF NOT EXISTS public.recruiter_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL indicates global / default templates
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'LinkedIn Connection Request', 'Cold Outreach', 'Referral Request', 'Follow-Up Message', 'Interview Thank You', 'Offer Negotiation Intro'
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_templates ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- Recruiters
CREATE POLICY "Users can operate on own recruiters" ON public.recruiters
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Activities
CREATE POLICY "Users can operate on own recruiter activities" ON public.recruiter_activities
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Follow-ups
CREATE POLICY "Users can operate on own recruiter followups" ON public.recruiter_followups
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Templates
CREATE POLICY "Users can operate on own templates or read global templates" ON public.recruiter_templates
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

-- 6. Indexes for optimized performance
CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON public.recruiters(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_activities_rec_id ON public.recruiter_activities(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_rec_followups_rec_id ON public.recruiter_followups(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_rec_templates_user_id ON public.recruiter_templates(user_id);

-- 7. Insert Default Predefined Templates
INSERT INTO public.recruiter_templates (name, type, subject, body) VALUES
('LinkedIn Connection Request', 'LinkedIn Connection Request', NULL, 'Hi {{name}}, I noticed your work recruiting for tech roles at {{company}}. I am a student targeting {{role}} opportunities. I would love to connect and follow your team''s hiring updates.'),
('Cold Outreach Email', 'Cold Outreach', 'Targeting {{role}} Opportunities at {{company}}', 'Dear {{name}},\n\nI hope you are doing well.\n\nI recently saw that {{company}} is looking for talented professionals for the {{role}} position. I have built projects using {{skills}} and believe I could contribute to your team.\n\nI have attached my resume for your review. Would you be open to a brief chat next week to discuss opportunities?\n\nBest regards,\n[My Name]'),
('Referral Request', 'Referral Request', NULL, 'Hi {{name}},\n\nThanks for connecting! I am very interested in the {{role}} opening at {{company}}. Given my experience with {{skills}}, I believe I align well with the team.\n\nWould you be open to referring me for this role? I have my resume ready and can share the job ID for your convenience.\n\nThanks for your support!\n[My Name]'),
('Outreach Follow-up', 'Follow-Up Message', 'Follow up: {{role}} Opportunities at {{company}}', 'Hi {{name}},\n\nI wanted to follow up briefly on my previous message regarding the {{role}} opportunity at {{company}}. I remain very interested in the position.\n\nI appreciate your time and consideration!\n\nBest,\n[My Name]'),
('Interview Thank You', 'Interview Thank You', 'Thank you - {{role}} Interview', 'Hi {{name}},\n\nThank you for taking the time to speak with me today regarding the {{role}} opportunity at {{company}}. I really enjoyed our conversation and learning more about the team.\n\nI am very excited about the possibility of joining {{company}}.\n\nBest regards,\n[My Name]');
