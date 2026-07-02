-- Migration: Offer Intelligence Engine (Phase 8)

-- 1. Create Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  ctc TEXT NOT NULL,
  base_salary TEXT,
  bonus TEXT,
  location TEXT,
  joining_date DATE,
  status TEXT DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Accepted', 'Declined', 'Counter-offered')),
  strength_score INTEGER DEFAULT 0 NOT NULL,
  market_benchmark_score INTEGER DEFAULT 0 NOT NULL,
  negotiation_suggestions TEXT[] DEFAULT '{}'::text[],
  offer_letter_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 3. Set RLS Policies
CREATE POLICY "Users can manage own offers" ON public.offers
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_app_id ON public.offers(application_id);
