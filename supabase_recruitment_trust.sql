-- Migration: Recruitment Trust & Verification Engine (Phase 0)

-- 1. Create Verified Companies Table
CREATE TABLE IF NOT EXISTS public.verified_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL UNIQUE,
  careers_domain text,
  official_website text,
  careers_page text,
  verified boolean DEFAULT true NOT NULL,
  trust_score integer DEFAULT 100 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Verified Recruiters Table
CREATE TABLE IF NOT EXISTS public.verified_recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_name text NOT NULL,
  recruiter_email text NOT NULL UNIQUE,
  company text,
  linkedin_url text,
  verification_status text DEFAULT 'Verified' NOT NULL, -- Verified, Suspicious, Revoked
  trust_score integer DEFAULT 100 NOT NULL,
  first_seen timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Trusted Domains Table
CREATE TABLE IF NOT EXISTS public.trusted_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  domain text NOT NULL UNIQUE,
  trust_score integer DEFAULT 100 NOT NULL,
  verified boolean DEFAULT true NOT NULL
);

-- 4. Create Email Trust Logs Table
CREATE TABLE IF NOT EXISTS public.email_trust_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email text NOT NULL,
  sender_domain text NOT NULL,
  subject text,
  classification text NOT NULL,
  confidence integer NOT NULL,
  trust_score integer NOT NULL,
  decision text NOT NULL, -- "Verified Recruitment Email", "Likely Recruitment Email", "Suspicious", "Potential Scam"
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Scam Detection Logs Table
CREATE TABLE IF NOT EXISTS public.scam_detection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email text NOT NULL,
  scam_probability integer NOT NULL,
  reasons text[] NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.verified_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_trust_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scam_detection_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Allow read access to anyone, but only admins to edit verified companies/recruiters/domains
DROP POLICY IF EXISTS "Allow read access for verified companies" ON public.verified_companies;
CREATE POLICY "Allow read access for verified companies" ON public.verified_companies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin operations for verified companies" ON public.verified_companies;
CREATE POLICY "Allow admin operations for verified companies" ON public.verified_companies
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Allow read access for verified recruiters" ON public.verified_recruiters;
CREATE POLICY "Allow read access for verified recruiters" ON public.verified_recruiters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin operations for verified recruiters" ON public.verified_recruiters;
CREATE POLICY "Allow admin operations for verified recruiters" ON public.verified_recruiters
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Allow read access for trusted domains" ON public.trusted_domains;
CREATE POLICY "Allow read access for trusted domains" ON public.trusted_domains
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin operations for trusted domains" ON public.trusted_domains;
CREATE POLICY "Allow admin operations for trusted domains" ON public.trusted_domains
  FOR ALL USING (public.is_admin());

-- Users can only manage their own email trust logs
DROP POLICY IF EXISTS "Allow users to manage own email trust logs" ON public.email_trust_logs;
CREATE POLICY "Allow users to manage own email trust logs" ON public.email_trust_logs
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Users can only manage their own scam detection logs
DROP POLICY IF EXISTS "Allow users to manage own scam detection logs" ON public.scam_detection_logs;
CREATE POLICY "Allow users to manage own scam detection logs" ON public.scam_detection_logs
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- 8. Seed Initial Trusted Domains and Companies
INSERT INTO public.verified_companies (company_name, careers_domain, official_website, careers_page, trust_score) VALUES
  ('Amazon', 'amazon.jobs', 'https://amazon.com', 'https://amazon.jobs', 100),
  ('Google', 'google.com', 'https://google.com', 'https://careers.google.com', 100),
  ('Microsoft', 'microsoft.com', 'https://microsoft.com', 'https://careers.microsoft.com', 100),
  ('Deloitte', 'deloitte.com', 'https://deloitte.com', 'https://careers.deloitte.com', 100),
  ('Accenture', 'accenture.com', 'https://accenture.com', 'https://careers.accenture.com', 100),
  ('Infosys', 'infosys.com', 'https://infosys.com', 'https://careers.infosys.com', 95),
  ('TCS', 'tcs.com', 'https://tcs.com', 'https://careers.tcs.com', 95),
  ('Wipro', 'wipro.com', 'https://wipro.com', 'https://careers.wipro.com', 95),
  ('IBM', 'ibm.com', 'https://ibm.com', 'https://careers.ibm.com', 100),
  ('Capgemini', 'capgemini.com', 'https://capgemini.com', 'https://careers.capgemini.com', 95),
  ('Cognizant', 'cognizant.com', 'https://cognizant.com', 'https://careers.cognizant.com', 95),
  ('Oracle', 'oracle.com', 'https://oracle.com', 'https://careers.oracle.com', 100),
  ('SAP', 'sap.com', 'https://sap.com', 'https://careers.sap.com', 100),
  ('Adobe', 'adobe.com', 'https://adobe.com', 'https://careers.adobe.com', 100),
  ('Flipkart', 'flipkart.com', 'https://flipkart.com', 'https://careers.flipkart.com', 95),
  ('Swiggy', 'swiggy.com', 'https://swiggy.com', 'https://careers.swiggy.com', 95),
  ('Zomato', 'zomato.com', 'https://zomato.com', 'https://careers.zomato.com', 95),
  ('PhonePe', 'phonepe.com', 'https://phonepe.com', 'https://careers.phonepe.com', 95),
  ('Paytm', 'paytm.com', 'https://paytm.com', 'https://careers.paytm.com', 90),
  ('NVIDIA', 'nvidia.com', 'https://nvidia.com', 'https://careers.nvidia.com', 100),
  ('Goldman Sachs', 'goldmansachs.com', 'https://goldmansachs.com', 'https://careers.goldmansachs.com', 100),
  ('JPMorgan Chase', 'jpmorganchase.com', 'https://jpmorgan.com', 'https://careers.jpmorgan.com', 100)
ON CONFLICT (company_name) DO NOTHING;

INSERT INTO public.trusted_domains (company, domain, trust_score) VALUES
  ('Amazon', 'amazon.jobs', 100),
  ('Amazon', 'amazon.com', 100),
  ('Google', 'google.com', 100),
  ('Microsoft', 'microsoft.com', 100),
  ('Deloitte', 'deloitte.com', 100),
  ('Accenture', 'accenture.com', 100),
  ('TCS', 'tcs.com', 95),
  ('Infosys', 'infosys.com', 95),
  ('Wipro', 'wipro.com', 95),
  ('IBM', 'ibm.com', 100),
  ('NVIDIA', 'nvidia.com', 100),
  ('HackerRank', 'hackerrank.com', 95),
  ('CodeSignal', 'codesignal.com', 95),
  ('Codility', 'codility.com', 95)
ON CONFLICT (domain) DO NOTHING;
