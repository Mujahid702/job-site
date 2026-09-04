# BuggedBrain User Data Isolation Security Audit

This document compiles the findings of the Phase 1 & 2 security audits of the BuggedBrain Next.js application, focusing on multi-tenant security, database row-level security (RLS), browser storage leaks, and AI request caching.

---

## 1. Database Row Level Security (RLS) Vulnerabilities

### 1.1. Insecure Copilot Memory RLS Policies
- **File**: [supabase_copilot_engine_upgrades.sql](file:///c:/Users/mujah/job-site/supabase_copilot_engine_upgrades.sql#L40-L44)
- **Vulnerability**: 
  - `CREATE POLICY "Users can read own copilot memory" ON public.copilot_memory FOR SELECT USING (true);`
  - `CREATE POLICY "Users can modify own copilot memory" ON public.copilot_memory FOR ALL USING (true);`
- **Impact**: Any authenticated user can read, modify, or delete any other user's Copilot strengths, weaknesses, repeated mistakes, and history.

### 1.2. Global Templates Modification & Deletion Risk
- **File**: [supabase_recruiter_crm.sql](file:///c:/Users/mujah/job-site/supabase_recruiter_crm.sql#L84-L85)
- **Vulnerability**: 
  - `CREATE POLICY "Users can operate on own templates or read global templates" ON public.recruiter_templates FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());`
- **Impact**: The policy is defined `FOR ALL`, which covers `UPDATE` and `DELETE`. Since `user_id IS NULL` is evaluated as true for global templates, any standard user can modify or delete global/default templates.

### 1.3. Loose Certificate Read Policy
- **File**: [supabase/migrations/011_rls_data_isolation.sql](file:///c:/Users/mujah/job-site/supabase/migrations/011_rls_data_isolation.sql#L143-L144)
- **Vulnerability**: 
  - `CREATE POLICY "Allow read certificates" ON public.assessment_certificates FOR SELECT USING (true);`
- **Impact**: Standard users can query the database directly to read and list all users' assessment certificates.

---

## 2. Insecure Storage Policies

### 2.1. Recruiter Verifications Storage Bucket
- **File**: [supabase_recruiter_verification.sql](file:///c:/Users/mujah/job-site/supabase_recruiter_verification.sql#L119-L120)
- **Vulnerability**: 
  - `CREATE POLICY "Authenticated users can upload verification documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recruiter-verifications' AND auth.uid() IS NOT NULL);`
- **Impact**: Any authenticated user can upload files under arbitrary paths in the `recruiter-verifications` bucket. The policy does not restrict uploads to paths containing the user's own `auth.uid()`.

---

## 3. Caching & Caching Key Isolation (AI Router)

### 3.1. Unscoped Cache Key Collision in AI Router
- **File**: [lib/ai/router.ts](file:///c:/Users/mujah/job-site/lib/ai/router.ts#L31-L41)
- **Vulnerability**: If `options.userId` is not passed to `generateResponse`, it defaults to `"anonymous"` when hashing the cache key prefix.
- **Impact**: Several API routes (e.g. `evaluate`, `jd-match`, `enhance`, `compare`, `builder`, `roadmap`) call `generateResponse` without passing the `userId` field. If two users execute operations with identical parameters (e.g. same JD or matching resumes), they can receive each other's cached AI evaluations.

---

## 4. Browser Local Storage Data Leaks

### 4.1. Unscoped Local Storage Keys
- **Files**:
  - [components/PlacementTrackerOS.tsx](file:///c:/Users/mujah/job-site/components/PlacementTrackerOS.tsx#L212)
  - [components/PlacementCRM.tsx](file:///c:/Users/mujah/job-site/components/PlacementCRM.tsx#L166)
  - [lib/context/SavedJobsContext.tsx](file:///c:/Users/mujah/job-site/lib/context/SavedJobsContext.tsx#L65)
  - [components/PrepChecklist.tsx](file:///c:/Users/mujah/job-site/components/PrepChecklist.tsx#L36)
- **Vulnerability**: Raw keys like `placement_crm_applications`, `placement_crm_documents`, `saved_jobs`, and `prep_checklist_${jobId}` are stored unscoped.
- **Impact**: When User A logs out and User B logs in on the same browser, User B temporarily or permanently views the saved jobs, CRM logs, and checklists of User A until a database refresh occurs, or permanently if network connectivity is slow.

---

## 5. Offline Sync Queue Isolation

### 5.1. Unscoped Sync Queue Key
- **File**: [lib/db/sync.ts](file:///c:/Users/mujah/job-site/lib/db/sync.ts#L12)
- **Vulnerability**: The write queue uses a single global key `buggedbrain_sync_queue`.
- **Impact**: If User A queues database inserts/updates while offline, and then logs out, User B logs in, when the queue triggers online synchronization, it executes User A's changes using User B's Supabase token, leading to RLS errors or cross-tenant data corruption.
