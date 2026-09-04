-- ==========================================================
-- 019_ledger_idempotency.sql
-- ==========================================================

-- Add idempotency_key column to public.career_ledger to enforce unique transactions
ALTER TABLE public.career_ledger 
ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
