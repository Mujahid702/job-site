-- Migration: Placement Intelligence Engine (Phase 9)

-- 1. Optimized Indexes for Analytics queries
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_date ON public.applications(applied_date);
CREATE INDEX IF NOT EXISTS idx_applications_company_role ON public.applications(company, job_title);

-- 2. Audit triggers to auto-update last_updated field on update
CREATE OR REPLACE FUNCTION public.set_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_updated = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_applications_last_updated
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE PROCEDURE public.set_last_updated_column();
