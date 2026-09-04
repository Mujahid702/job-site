# BuggedBrain User Data Isolation Model

This document maps the security architecture implemented in the BuggedBrain application to enforce multi-tenant data isolation, security trust boundaries, and user privacy.

---

## 1. Identity & Resolution Model

All requests must be securely associated with the authenticated user ID. Client-supplied user IDs are treated as untrusted boundaries.

### 1.1. Server-Side Identity Verification
- **API Routes**: Resolve user session dynamically from incoming request cookies via `supabase.auth.getUser()`.
- **AI Gateway Gateway**: Resolves `userId` from the active server session context in [lib/ai/router.ts](file:///c:/Users/mujah/job-site/lib/ai/router.ts) as a fallback if not passed.

---

## 2. Database RLS Policies

All tenant-specific tables enforce Row Level Security (RLS) constraints to prevent horizontal privilege escalation.

| Table Name | RLS Constraints / Policies |
| :--- | :--- |
| `profiles` | `auth.uid() = user_id OR public.is_admin()` |
| `resume_scans` | `auth.uid() = user_id OR public.is_admin()` |
| `jd_matches` | `auth.uid() = user_id OR public.is_admin()` |
| `copilot_memory` | `auth.uid()::text = user_id OR public.is_admin()` |
| `recruiter_templates` | Read: `auth.uid() = user_id OR user_id IS NULL OR public.is_admin()` <br> Write: `auth.uid() = user_id OR public.is_admin()` |
| `assessment_certificates` | `auth.uid()::text = user_id OR public.is_admin()` |

---

## 3. Storage Security Model

Access and modifications to files in private Supabase Storage buckets are isolated at the folder level.

### 3.1. Folder Path Scoping
- **Bucket**: `recruiter-verifications` (Private)
- **RLS Upload Constraint**: `INSERT` operations on `storage.objects` check that the folder prefix matches the active user:
  `auth.uid()::text = (regexp_split_to_array(name, '/'))[1]`

---

## 4. Cache Scoping Model

All hot-data caching at the application layer must include user context.

### 4.1. AI Prompt Caching (Redis)
- Cache keys are generated using a SHA-256 hash of the following parameters:
  - Prompt text
  - System instruction
  - Adapter Model & Temperature
  - Dynamic user-scoped `userId` (resolved server-side)

---

## 5. Browser Local Storage Model

To support offline-first features and cache fallbacks safely on shared devices, all local storage items must be user-scoped.

### 5.1. User Scoped Fallbacks
LocalStorage items use `getScopedKey(key, userId)` resolving to `key_${userId}`:
- `placement_crm_applications_${userId}`
- `placement_crm_documents_${userId}`
- `saved_jobs_${userId}`
- `prep_checklist_${jobId}_${userId}`

### 5.2. Session Purge on Logout
Upon receiving a `SIGNED_OUT` auth transition event, all keys matching `_guest`, standard UUID patterns, or specific application state prefixes are automatically deleted.
