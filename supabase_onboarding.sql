-- SQL Migration to add Onboarding columns to profiles table

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started'; -- 'not_started', 'in_progress', 'completed'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS career_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dream_companies TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_locations TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_ctc TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;
