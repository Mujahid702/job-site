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

### 6. Assessment Ecosystem Tables (`public.assessment_*`)
Tracks questions, coding compilations, WASM SQL seeds, timed session states, scores, streaks, and logs.
*   **`assessment_categories`**: Core category slugs mapping (`slug` PK, `name` text).
*   **`assessment_topics`**: Concepts list (`id` uuid PK, `name` text, `category_slug` text FK).
*   **`assessment_questions`**: Questions bank (`id` uuid PK, `topic_id` uuid FK, `question_text` text, `difficulty` text check constraint, `type` text check constraint, `marks` integer).
*   **`assessment_options`**: Choice options (`id` uuid PK, `question_id` uuid FK, `option_text` text, `is_correct` boolean).
*   **`coding_problems`**: Starter codes, input/output shapes, constraints, hidden test cases (`question_id` uuid PK/FK, `starter_codes` jsonb, `sample_test_cases` jsonb, `time_limit_ms` integer).
*   **`sql_problems`**: Schema seed queries, correct queries (`question_id` uuid PK/FK, `sql_schema_seed` text, `correct_query` text).
*   **`assessment_templates`**: Timed mock templates (`id` uuid PK, `title` text, `duration_minutes` integer, `passing_percentage` integer).
*   **`assessment_sessions`**: Timed attempt tracker states (`id` uuid PK, `user_id` text, `template_id` uuid FK, `session_type` text check constraint, `status` text check constraint, `score_percentage` numeric, `passed` boolean).
*   **`assessment_attempts`**: Individual exam attempt links (`id` uuid PK, `session_id` uuid FK, `user_id` text, `is_completed` boolean).
*   **`assessment_answers`**: Solved answers registry logs (`id` uuid PK, `attempt_id` uuid FK, `question_id` uuid FK, `is_correct` boolean, `time_spent_seconds` integer).
*   **`coding_submissions`**: Python/JS code outputs history (`id` uuid PK, `attempt_id` uuid FK, `question_id` uuid FK, `user_id` text, `status` text, `execution_time_ms` integer).
*   **`sql_submissions`**: Executed user SQLite queries (`id` uuid PK, `attempt_id` uuid FK, `question_id` uuid FK, `user_id` text, `submitted_query` text, `status` text).
*   **`assessment_scores`**: Logged completed attempts scorecard totals (`id` uuid PK, `attempt_id` uuid FK, `user_id` text, `correct_answers` integer, `score_percentage` numeric).
*   **`assessment_topic_scores`**: Topic rollup records (`user_id` text, `topic_id` uuid FK, `total_solved` integer, `accuracy_percentage` numeric).
*   **`assessment_performance`**: Daily time series aggregates (`id` uuid PK, `user_id` text, `date` date, `total_time_spent_seconds` integer, `average_accuracy_percentage` numeric).
*   **`assessment_recommendations`**: AI study suggestions (`id` uuid PK, `user_id` text, `recommended_topic_id` uuid FK, `priority` text).
*   **`ai_generated_questions`**: AI Generator Draft logs (`id` uuid PK, `question_id` uuid FK, `generation_model` text, `prompt_version` text, `validation_result` jsonb, `admin_approved` boolean).

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
| `public.assessment_categories` | SELECT | `true` (Public read allowed) |
| `public.assessment_categories` | WRITE | `public.is_admin()` (Admin write-only) |
| `public.assessment_topics` | SELECT | `true` (Public read allowed) |
| `public.assessment_topics` | WRITE | `public.is_admin()` (Admin write-only) |
| `public.assessment_questions` | SELECT | `true` (Public read allowed) |
| `public.assessment_questions` | WRITE | `public.is_admin()` (Admin write-only) |
| `public.assessment_sessions` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.assessment_attempts` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.assessment_answers` | ALL | `auth.uid()::text = (SELECT user_id FROM public.assessment_attempts WHERE id = attempt_id) OR public.is_admin()` |
| `public.coding_submissions` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.sql_submissions` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.assessment_scores` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.assessment_topic_scores` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.assessment_performance` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.assessment_recommendations` | ALL | `auth.uid()::text = user_id::text OR public.is_admin()` |
| `public.ai_generated_questions` | ALL | `public.is_admin()` (Admin write-only) |

---

## 4. Database Storage Buckets

1.  **`resumes`**:
    - **Purpose**: File uploads archiving candidate raw PDF/Docx files.
    - **RLS**: Authenticated users can read/write objects under `resumes/user_id/*`. Public read is forbidden.
2.  **`portfolio_assets`**:
    - **Purpose**: Images and media files uploaded during blueprint design documentation steps.
    - **RLS**: Public read allowed; write access restricted to owner.
