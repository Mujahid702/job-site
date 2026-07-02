-- Migration: Recruiter CRM Integration (Phase 7)

-- 1. Add application link to recruiters if not already present
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL;

-- 2. Create Recruiter Conversations Table to track communication history
CREATE TABLE IF NOT EXISTS public.recruiter_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT, -- Ingestion message identifier (e.g. Gmail ID)
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.recruiter_conversations ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies
CREATE POLICY "Users can manage own recruiter conversations" ON public.recruiter_conversations
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_rec_conv_user_id ON public.recruiter_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_conv_rec_id ON public.recruiter_conversations(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_rec_conv_msg_id ON public.recruiter_conversations(message_id);
