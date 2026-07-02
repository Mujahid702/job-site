# Engineering Module Ownership Matrix

This document defines primary and secondary developer owners, completion percentages, database tables, API routes, and pending tasks across the platform modules.

---

## Module Ownership Grid

| Module | Primary Owner | Secondary Owner | Current Status | Current Completion | Direct Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Resume OS** | Developer A | Developer B | Stable | **92%** | ATS scanner, caches |
| **Project OS** | Developer B | Developer A | Stable | **90%** | Blueprints engine |
| **Career Navigator** | Developer B | Developer A | Stable | **90%** | Roadmaps presets |
| **Assessment OS** | Developer A | Developer B | Under Dev | **50%** | WebAssembly runtime |
| **Recruiter CRM** | Developer B | Developer A | Active | **65%** | LinkedIn validate |
| **Mentorship OS** | Developer B | Developer A | Active | **60%** | Calendar schedules |
| **AI Copilot** | Developer A | Developer B | Stable | **85%** | AI Gateway router |
| **Admin Hub** | Developer A | Developer B | Stable | **90%** | System settings |

---

## Detailed Module Ownership Breakdown

### 1. Resume OS
-   **Owner**: Developer A
-   **Secondary Owner**: Developer B
-   **Status**: Production Stable
-   **Completion %**: 92%
-   **Database Tables**: `public.profiles`, `public.resume_scans`, `public.jd_matches`, `public.resume_analytics`
-   **API Routes**: `/api/resume/builder`, `/api/resume/evaluate`, `/api/resume/jd-match`, `/api/resume/optimize`
-   **Services**: `services/resume-parser.ts`, `services/file-validator.ts`
-   **Pending Tasks**:
    - [ ] Auto-synchronization of cached scan files on new resume uploads.
    - [ ] Live page split layout parser diagnostics.
-   **Known Issues**:
    - Parsing speed can drop on scanned image PDFs.
-   **Future Improvements**:
    - Support for multiple active resumes comparisons.

### 2. Project Advisor OS
-   **Owner**: Developer B
-   **Secondary Owner**: Developer A
-   **Status**: Production Stable
-   **Completion %**: 90%
-   **Database Tables**: `public.student_projects`, `public.project_companies`, `public.project_templates`
-   **API Routes**: `/api/placement/projects/generate`, `/api/admin/project-templates`
-   **Services**: `services/project-generator.ts`
-   **Pending Tasks**:
    - [ ] Dynamic repository skeleton zip exporter.
    - [ ] Interactive execution log emulator widget.
-   **Known Issues**:
    - Legacy blueprints display empty levels unless formatted by client-side adapter.
-   **Future Improvements**:
    - Dynamic connection loops testing local setups automatically.

### 3. Career Navigator
-   **Owner**: Developer B
-   **Secondary Owner**: Developer A
-   **Status**: Production Stable
-   **Completion %**: 90%
-   **Database Tables**: `public.roadmap_progress`, `public.placement_readiness`
-   **API Routes**: `/api/resume/roadmap`, `/api/placement/copilot`
-   **Services**: `services/roadmap-engine.ts`
-   **Pending Tasks**:
    - [ ] Dynamic calendar schedule allocations.
    - [ ] Assessment OS sync loops for code sandbox metrics.
-   **Known Issues**:
    - Manual overrides can be clicked on self-reported tasks without verification.
-   **Future Improvements**:
    - Personalized recommendations matching local vacancies.
