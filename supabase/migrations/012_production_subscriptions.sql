-- ==========================================================
-- 012_production_subscriptions.sql
-- ==========================================================

-- 1. Create Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0.00,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  allowed_features text[] NOT NULL DEFAULT '{}'::text[],
  monthly_limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority_ai boolean NOT NULL DEFAULT false,
  storage text NOT NULL DEFAULT '100MB',
  assessment_limits integer NOT NULL DEFAULT 3,
  resume_limits integer NOT NULL DEFAULT 3,
  project_limits integer NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Populate default plans
INSERT INTO public.subscription_plans (id, name, price, billing_cycle, allowed_features, monthly_limits, priority_ai, storage, assessment_limits, resume_limits, project_limits)
VALUES
  ('free', 'Free', 0.00, 'monthly', 
   ARRAY['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community'],
   '{"ats_analyzer": 3, "jd_matcher": 3, "resume_builder": 1, "resume_enhancer": 2, "resume_comparison": 2, "resume_analytics": -1, "project_generation": 3, "practice_mode": -1, "exam_mode": 3, "cover_letter_generation": 5, "mock_interview_mins": 0, "community": -1}',
   false, '100MB', 3, 3, 3),
   
  ('starter', 'Starter', 9.99, 'monthly', 
   ARRAY['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community', 'mock_interview'],
   '{"ats_analyzer": 10, "jd_matcher": 10, "resume_builder": 5, "resume_enhancer": 10, "resume_comparison": 10, "resume_analytics": -1, "project_generation": 10, "practice_mode": -1, "exam_mode": 10, "cover_letter_generation": 15, "mock_interview_mins": 30, "community": -1}',
   false, '500MB', 10, 10, 10),
   
  ('pro', 'Pro', 29.99, 'monthly', 
   ARRAY['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community', 'mock_interview'],
   '{"ats_analyzer": -1, "jd_matcher": -1, "resume_builder": -1, "resume_enhancer": -1, "resume_comparison": -1, "resume_analytics": -1, "project_generation": -1, "practice_mode": -1, "exam_mode": -1, "cover_letter_generation": -1, "mock_interview_mins": -1, "community": -1}',
   true, '2GB', -1, -1, -1),
   
  ('ultimate', 'Ultimate', 79.99, 'monthly', 
   ARRAY['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community', 'mock_interview'],
   '{"ats_analyzer": -1, "jd_matcher": -1, "resume_builder": -1, "resume_enhancer": -1, "resume_comparison": -1, "resume_analytics": -1, "project_generation": -1, "practice_mode": -1, "exam_mode": -1, "cover_letter_generation": -1, "mock_interview_mins": -1, "community": -1}',
   true, '10GB', -1, -1, -1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_cycle = EXCLUDED.billing_cycle,
  allowed_features = EXCLUDED.allowed_features,
  monthly_limits = EXCLUDED.monthly_limits,
  priority_ai = EXCLUDED.priority_ai,
  storage = EXCLUDED.storage,
  assessment_limits = EXCLUDED.assessment_limits,
  resume_limits = EXCLUDED.resume_limits,
  project_limits = EXCLUDED.project_limits,
  updated_at = timezone('utc'::text, now());

-- 2. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan text NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  payment_provider text,
  payment_reference text,
  purchase_date timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  expiry_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'past_due')),
  auto_renew boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Feature Usage Table
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  monthly_limit integer NOT NULL,
  current_month text NOT NULL, -- format: 'YYYY-MM'
  reset_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, feature_name, current_month)
);

-- 4. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  order_reference text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL,
  transaction_id text,
  invoice_number text,
  payment_date timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(payment_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL,
  pdf_url text,
  issued_date timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
-- Plans Policies (read for all, admin write)
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (public.is_admin());

-- Subscriptions Policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_admin());

-- Feature Usage Policies
DROP POLICY IF EXISTS "Users can view own feature usage" ON public.feature_usage;
CREATE POLICY "Users can view own feature usage" ON public.feature_usage
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage feature usage" ON public.feature_usage;
CREATE POLICY "Admins can manage feature usage" ON public.feature_usage
  FOR ALL USING (public.is_admin());

-- Payments Policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (public.is_admin());

-- Invoices Policies
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (public.is_admin());

-- 6. Trigger to automatically initialize a FREE subscription on user profiles
CREATE OR REPLACE FUNCTION public.handle_profile_production_subscription_init()
RETURNS trigger as $$
BEGIN
  INSERT INTO public.subscriptions (user_id, subscription_plan, billing_cycle, status, auto_renew)
  VALUES (new.user_id, 'free', 'monthly', 'active', true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on profiles
DROP TRIGGER IF EXISTS on_profile_production_subscription_created ON public.profiles;
CREATE TRIGGER on_profile_production_subscription_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_production_subscription_init();

-- 7. Backfill existing profiles with FREE plan subscription if missing
INSERT INTO public.subscriptions (user_id, subscription_plan, billing_cycle, status, auto_renew)
SELECT user_id, 'free', 'monthly', 'active', true
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
