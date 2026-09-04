-- SQL Migration to set up Recruiter Verification System, Reputation, Reports, RLS, and Storage Bucket

-- 1. Create Recruiter Verifications Table
CREATE TABLE IF NOT EXISTS public.recruiter_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID UNIQUE NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'Pending',
  verification_method TEXT,
  company_email TEXT,
  company_domain TEXT,
  linkedin_url TEXT,
  linkedin_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  admin_verified BOOLEAN DEFAULT false,
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  reputation_score NUMERIC(3,2) DEFAULT 0.00,
  fraud_risk_score INTEGER DEFAULT 0 CHECK (fraud_risk_score >= 0 AND fraud_risk_score <= 100),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_verification_status CHECK (verification_status IN ('Pending', 'Under Review', 'Verified', 'Rejected', 'Suspended')),
  CONSTRAINT check_verification_method CHECK (verification_method IN ('Corporate Email', 'LinkedIn', 'Manual'))
);

-- 2. Create Recruiter Reports Table
CREATE TABLE IF NOT EXISTS public.recruiter_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_report_reason CHECK (reason IN ('Fake Recruiter', 'Spam', 'Scam', 'Harassment', 'Fake Referral', 'Misleading Job', 'Other')),
  CONSTRAINT check_report_status CHECK (status IN ('Pending', 'Resolved', 'Dismissed'))
);

-- 3. Create Recruiter Ratings Table
CREATE TABLE IF NOT EXISTS public.recruiter_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professionalism INTEGER NOT NULL CHECK (professionalism >= 1 AND professionalism <= 5),
  response_time INTEGER NOT NULL CHECK (response_time >= 1 AND response_time <= 5),
  helpfulness INTEGER NOT NULL CHECK (helpfulness >= 1 AND helpfulness <= 5),
  referral_quality INTEGER NOT NULL CHECK (referral_quality >= 1 AND referral_quality <= 5),
  communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_recruiter_rating UNIQUE (user_id, recruiter_id)
);

-- 4. Enable RLS on all tables
ALTER TABLE public.recruiter_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_ratings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Anyone can view verifications (needed to show trust score & badges)
DROP POLICY IF EXISTS "Anyone can view recruiter verifications" ON public.recruiter_verifications;
CREATE POLICY "Anyone can view recruiter verifications" ON public.recruiter_verifications
  FOR SELECT USING (true);

-- Recruiter profile owner (matched via subquery checking user_id on recruiters) or admin can modify
DROP POLICY IF EXISTS "Owners or admins can manage recruiter verifications" ON public.recruiter_verifications;
CREATE POLICY "Owners or admins can manage recruiter verifications" ON public.recruiter_verifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.recruiters 
      WHERE public.recruiters.id = recruiter_verifications.recruiter_id 
      AND public.recruiters.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Admins can view all reports, users can view reports they created
DROP POLICY IF EXISTS "Authorized view of recruiter reports" ON public.recruiter_reports;
CREATE POLICY "Authorized view of recruiter reports" ON public.recruiter_reports
  FOR SELECT USING (reporter_user_id = auth.uid() OR public.is_admin());

-- Users can file reports
DROP POLICY IF EXISTS "Students can file reports" ON public.recruiter_reports;
CREATE POLICY "Students can file reports" ON public.recruiter_reports
  FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

-- Admins can update reports (resolve/dismiss)
DROP POLICY IF EXISTS "Admins can update reports" ON public.recruiter_reports;
CREATE POLICY "Admins can update reports" ON public.recruiter_reports
  FOR UPDATE USING (public.is_admin());

-- Anyone can view ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.recruiter_ratings;
CREATE POLICY "Anyone can view ratings" ON public.recruiter_ratings
  FOR SELECT USING (true);

-- Students can insert ratings
DROP POLICY IF EXISTS "Students can rate recruiters" ON public.recruiter_ratings;
CREATE POLICY "Students can rate recruiters" ON public.recruiter_ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Students can update their own reviews or admin bypass
DROP POLICY IF EXISTS "Students can edit own ratings" ON public.recruiter_ratings;
CREATE POLICY "Students can edit own ratings" ON public.recruiter_ratings
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());


-- 6. Setup Storage Bucket for recruiter verification documents (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recruiter-verifications', 
  'recruiter-verifications', 
  false, 
  5242880, 
  '{"image/jpeg","image/png","application/pdf"}'
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Admins only read verification documents" ON storage.objects;
CREATE POLICY "Admins only read verification documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'recruiter-verifications' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can upload verification documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recruiter-verifications' 
    AND auth.uid()::text = (regexp_split_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS "Admins only modify verification documents" ON storage.objects;
CREATE POLICY "Admins only modify verification documents" ON storage.objects
  FOR ALL USING (bucket_id = 'recruiter-verifications' AND public.is_admin());


-- 7. Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_verifications_rec_id ON public.recruiter_verifications(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.recruiter_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_reports_rec_id ON public.recruiter_reports(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rec_id ON public.recruiter_ratings(recruiter_id);
