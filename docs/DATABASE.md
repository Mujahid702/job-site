# Database Schema & RLS Catalog Reference

This document maps all public database tables, security policies, triggers, custom Postgres functions, and schema definitions.

---

## 1. Core Database Tables & Columns Mappings

### 1. `public.profiles`
Stores student profile onboarding status, resume URLs, resume text metadata, and targeted tracks.
- `id` (uuid, PK): Auto-generated unique ID.
- `user_id` (uuid, Unique, FK -> auth.users.id): Link to platform authentication credentials.
- `full_name`, `email`, `phone_number` (text): Core contact inputs.
- `college`, `degree`, `branch` (text): Academic metrics.
- `graduation_year` (integer), `current_semester` (integer).
- `cgpa` (text), `target_role` (text): Placement filters.
- `skills` (text[]): Active parsed skills.
- `linkedin_url`, `github_url`, `portfolio_url`, `resume_url` (text): Portfolios links.
- `resume_name` (text), `resume_uploaded_at` (timestamptz).
- `raw_profile_data` (jsonb): Structured CV parsing (education, experience history, certifications, projects details).
- `onboarding_completed` (boolean), `onboarding_status` (text), `onboarding_step` (integer).
- `badges` (text[]): Gamified achievements badges.

### 2. `public.roadmap_progress`
Logs student roadmap checkpoints status.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users.id)
- `roadmap_name` (text): target track name.
- `step_name` (text): unique task checkpoint description.
- `completed` (boolean): completion status flag.
- `completed_at` (timestamptz)
- *Constraints*: Unique combination of `(user_id, roadmap_name, step_name)`.

### 3. `public.resume_scans`
Archives detailed parser ratings and ATS feedback.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users.id)
- `resume_name` (text)
- `ats_score` (integer): calculated format/ATS rating (0-100).
- `role_fit_score` (integer): keyword density rating.
- `analysis` (jsonb): JSON analysis containing missed keywords list, format suggestions, and spelling errors.

### 4. `public.student_projects`
Maintains registered project blueprints generated via Project Advisor OS.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users.id)
- `title` (text), `role` (text), `company` (text).
- `difficulty` (text), `interest_area` (text).
- `blueprint` (jsonb): Full system design specification (System overview, databases, code skeleton, folder tree).
- `readiness_checklist` (jsonb): Tracks developer checklist stages (planning, development, testing, deployment, docs).

### 5. `public.applications`
Monitors placement pipelines for the CRM and Application Tracker modules.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users.id)
- `job_title` (text), `company` (text), `application_link` (text).
- `status` (text): Check-constrained (`Saved`, `Applied`, `Assessment Scheduled`, `Assessment Completed`, `Technical Interview`, `HR Interview`, `Offer Received`, `Joined`, `Rejected`, `Withdrawn`).
- `applied_date` (timestamptz), `last_updated` (timestamptz).
- `salary` (text), `location` (text), `notes` (text).
- `details` (jsonb): Nested CRM values (interviews scheduler, schedules).

---

## 2. Postgres Functions & Custom Triggers

### 1. Admin Verification Helper (`public.is_admin()`)
Evaluates if the active executing token belongs to an administrator.
- **Implementation**:
  ```sql
  create or replace function public.is_admin()
  returns boolean as $$
  begin
    return exists (
      select 1 from auth.users
      where id = auth.uid()
      and (raw_user_meta_data->>'role' = 'admin' or raw_user_meta_data->>'role' = 'super_admin')
    );
  end;
  $$ language plpgsql security definer;
  ```

### 2. Auto-Update Timestamp Trigger
Executes on modifications to table rows to keep `updated_at` updated.
- **Trigger**: `set_timestamp` on tables `profiles`, `placement_scores`, `applications`.

---

## 3. Row Level Security (RLS) Policy Guide

To prevent developer data overlaps and secure privacy, RLS is strictly enforced on all public tables:

| Table Name | Policy Action | Checked Policy Clause |
| :--- | :--- | :--- |
| `public.profiles` | ALL | `auth.uid() = user_id OR public.is_admin()` |
| `public.roadmap_progress` | ALL | `auth.uid() = user_id OR public.is_admin()` |
| `public.student_projects` | ALL | `auth.uid() = user_id OR public.is_admin()` |
| `public.resume_scans` | ALL | `auth.uid() = user_id OR public.is_admin()` |
| `public.applications` | ALL | `auth.uid() = user_id OR public.is_admin()` |
| `public.project_templates` | SELECT | `true` (Public read allowed) |
| `public.project_templates` | WRITE (ALL) | `public.is_admin()` (Admin write-only) |
| `public.project_companies` | SELECT | `true` (Public read allowed) |
| `public.project_companies` | WRITE (ALL) | `public.is_admin()` (Admin write-only) |

---

## 4. Database Storage Buckets

1.  **`resumes`**:
    - **Purpose**: File uploads archiving candidate raw PDF/Docx files.
    - **RLS**: Authenticated users can read/write objects under `resumes/user_id/*`. Public read is forbidden.
2.  **`portfolio_assets`**:
    - **Purpose**: Images and media files uploaded during blueprint design documentation steps.
    - **RLS**: Public read allowed; write access restricted to owner.
