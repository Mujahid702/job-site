# Module Status Dashboard & Ownership

This document lists developer ownership, system dependencies, API paths, and feature completion status across the BuggedBrain platform.

---

## 1. Resume OS
*   **Primary Owner**: Developer A (Resume/ATS Lead)
*   **Secondary Owner**: Developer B
*   **Status**: Active / Production Stable
*   **Current Completion**: **92%**
*   **Dependencies**: ATS Engine, JD Matcher, Resume Caches
*   **Database Tables**: `public.profiles`, `public.resume_scans`, `public.jd_matches`, `public.resume_analytics`
*   **API Routes**: `/api/resume/builder`, `/api/resume/evaluate`, `/api/resume/jd-match`, `/api/resume/optimize`
*   **Core Components**: `components/ResumeOS.tsx`, `components/ATSScanner.tsx`, `components/JDMatcher.tsx`
*   **Pending Tasks**:
    - [ ] Auto-synchronization checks on cached scans when users upload newer resumes.
    - [ ] Real-time PDF layout diagnostics (rendering checks, page split limits warnings).

---

## 2. Project Advisor OS
*   **Primary Owner**: Developer B (Placement Mentor Lead)
*   **Secondary Owner**: Developer A
*   **Status**: Active / Production Stable
*   **Current Completion**: **90%**
*   **Dependencies**: Discovery Engine, 5-Level progressive Mock interview schema
*   **Database Tables**: `public.student_projects`, `public.project_companies`, `public.project_templates`
*   **API Routes**: `/api/placement/projects/generate`, `/api/admin/project-templates`
*   **Core Components**: `components/ProjectOS.tsx`, `components/PlacementCRM.tsx`
*   **Pending Tasks**:
    - [ ] Dynamic repository skeleton code export packages.
    - [ ] Real-time execution logs simulation during blueprints walkthrough checks.

---

## 3. Career Navigator
*   **Primary Owner**: Developer B (Career Progression Lead)
*   **Secondary Owner**: Developer A
*   **Status**: Active / Production Stable
*   **Current Completion**: **90%**
*   **Dependencies**: Career roadmap presets, profile statistics indexes, AI Copilot Gateway
*   **Database Tables**: `public.roadmap_progress`, `public.placement_scores`, `public.placement_readiness`
*   **API Routes**: `/api/resume/roadmap`, `/api/placement/copilot`
*   **Core Components**: `components/CareerRoadmapNavigator.tsx`
*   **Pending Tasks**:
    - [ ] Dynamic calendar planning sync with NextAuth sessions.
    - [ ] Automated verification metrics triggers for Assessment OS scores.

---

## 4. Assessment OS & Code Sandbox
*   **Primary Owner**: Developer A (Evaluation Lead)
*   **Secondary Owner**: Developer B
*   **Status**: Active / Production Stable (Replaced Legacy OS)
*   **Current Completion**: **100%**
*   **Dependencies**: WebAssembly SQLite sql.js Sandbox, Judge0 Code Executor Sandbox, AI Router failovers
*   **Database Tables**: `public.assessment_categories`, `public.assessment_topics`, `public.assessment_subtopics`, `public.assessment_questions`, `public.coding_problems`, `public.sql_problems`, `public.assessment_templates`, `public.assessment_template_questions`, `public.company_assessment_templates`, `public.assessment_sessions`, `public.assessment_attempts`, `public.assessment_answers`, `public.coding_submissions`, `public.sql_submissions`, `public.assessment_scores`, `public.assessment_topic_scores`, `public.assessment_performance`, `public.assessment_recommendations`, `public.ai_generated_questions`
*   **API Routes**: `/api/assessments/catalog`, `/api/assessments/analytics/performance`, `/api/assessments/exam/start`, `/api/assessments/practice/start`, `/api/assessments/session/answer`, `/api/assessments/session/coding-submit`, `/api/assessments/session/sql-submit`, `/api/assessments/session/finish`, `/api/assessments/session/result`, `/api/admin/assessments/ai-generate`
*   **Core Components**: `components/AssessmentOS.tsx` (unified student assessments playground, timed mock exam viewport, SQLite schema viewer, Monaco editor integrations, and historical scorecards component)
*   **Pending Tasks**:
    - [x] Integration of interactive code sandboxes with Monaco editor views.
    - [x] Local runtime diagnostics using WebAssembly bindings.
    - [x] Security User Isolation verification and automated regression test coverage.

---

## 5. Recruiter CRM & Trust Hub
*   **Primary Owner**: Developer B (Partnerships Lead)
*   **Secondary Owner**: Developer A
*   **Status**: Active / Iterating
*   **Current Completion**: **60%**
*   **Dependencies**: LinkedIn validators, OTP notification services
*   **Database Tables**: `public.recruiter_crm`, `public.recruiter_verifications`
*   **API Routes**: `/api/recruiter-verifications/otp/send`, `/api/recruiter-verifications/otp/verify`
*   **Core Components**: `components/PlacementCRM.tsx`, `components/RecruiterPortal.tsx`
*   **Pending Tasks**:
    - [ ] Bulk candidate resumes export tool with digital signatures.
    - [ ] Auto-match notification dispatches to recruiters.
