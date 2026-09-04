-- SQL Migration: Enforce Strict Multi-Tenant Isolation & RLS Security Updates

-- 1. Secure copilot_memory RLS
ALTER TABLE IF EXISTS public.copilot_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own copilot memory" ON public.copilot_memory;
DROP POLICY IF EXISTS "Users can modify own copilot memory" ON public.copilot_memory;

CREATE POLICY "Users can read own copilot memory" ON public.copilot_memory
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Users can modify own copilot memory" ON public.copilot_memory
  FOR ALL USING (auth.uid()::text = user_id OR public.is_admin());


-- 2. Secure recruiter_templates global modification loophole
ALTER TABLE IF EXISTS public.recruiter_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can operate on own templates or read global templates" ON public.recruiter_templates;

-- Split policy: standard users can read global templates, but cannot write/modify them
CREATE POLICY "Anyone can view own templates or global templates" ON public.recruiter_templates
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

CREATE POLICY "Users can modify own templates" ON public.recruiter_templates
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());


-- 3. Secure assessment_certificates read-all loophole
ALTER TABLE IF EXISTS public.assessment_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read certificates" ON public.assessment_certificates;

CREATE POLICY "Allow read certificates" ON public.assessment_certificates
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());


-- 4. Secure recruiter-verifications storage bucket uploads
DROP POLICY IF EXISTS "Authenticated users can upload verification documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recruiter-verifications' 
    AND auth.uid()::text = (regexp_split_to_array(name, '/'))[1]
  );
