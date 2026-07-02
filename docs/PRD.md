# Product Requirement Document (PRD) — BuggedBrain

## 1. Platform Vision & Mission

### Vision
BuggedBrain is a recruiter-aligned placement readiness platform. It bridges the gap between student portfolios and real enterprise hiring demands by analyzing candidate profiles, simulating production-grade engineering mock rounds, and certifying candidate skill levels with automatic, verifiable metrics.

### Mission
Eliminate generic, template-driven portfolios and AI resume fluff. BuggedBrain empowers students to design high-complexity systems and validates their skills using automated profile checks, ensuring recruiters receive pre-vetted, verified talent pipelines.

---

## 2. Target Audience & Personas

### 1. Student / Candidate
*   **Context**: Aspiring software engineers looking for internships or full-time placement drives.
*   **Pain Points**: Standard resumes are rejected by ATS filters, mock interview practice is generic, and portfolio projects look like simple copy-paste code.
*   **Goal**: Acquire system design experience, pass ATS filters with target-job match tuning, practice realistic system-level interviews, and secure placement clearance.

### 2. Recruiter
*   **Context**: Corporate talent acquisition managers searching for technical hires.
*   **Pain Points**: Flooded with resumes listing matching keywords but no implementation skill; hard to verify if projects were actually built by the candidate.
*   **Goal**: Search a directory of pre-vetted candidates with validated ATS scores, average mock interview metrics, and verified project uploads.

### 3. Administrator / Coordinator
*   **Context**: Campus placement officers or SaaS platform operators.
*   **Pain Points**: Manually managing hundreds of candidate CVs, matching them with job requirements, and tracking prep progress is tedious.
*   **Goal**: Monitor student readiness diagnostics, ingest new jobs via scrapers, update recruiter configurations, and audit telemetry.

### 4. Technical Mentor
*   **Context**: Senior engineers conducting mock technical reviews.
*   **Pain Points**: Scheduling is chaotic and feedback logs are unstructured.
*   **Goal**: Set slot availability, receive automated bookings, and document candidate evaluations.

---

## 3. End-to-End User Journeys

### Candidate (Student) Journey
```
[Upload Resume File] ──> [ATS Diagnostic (ATS >= 70)] ──> [Dynamic Career Roadmap Stage Checkpoints]
                                                                        │
[Clearance Verified] <── [Missions completed (Auto XP)] <── [Level 1-5 FAANG Project Mock Interview]
```
1.  **Onboarding**: Candidate signs up, inputs details, and uploads their resume file.
2.  **ATS Assessment**: Resume OS scans the text, logs ATS rating, lists key gaps, and tracks comparison matches.
3.  **Roadmap Alignment**: The Career Roadmap system generates 5 progressive learning stages, recommending resources and mapping checklists.
4.  **Hands-on Project**: Project Advisor OS recommends system designs (e.g., Movie Streaming, Trade Log Book). Candidate registers a project.
5.  **Placement Mock Rounds**: Candidate enters the FAANG Interview Station, passing 5 progressive levels of Q&A.
6.  **Progress Verification Sync**: The platform monitors metrics (ATS score, mock levels passed, projects registered). If thresholds are met, corresponding roadmap tasks are marked **Auto-Verified**.
7.  **Milestone Completion**: When a stage hits 100%, the candidate earns XP rewards (+500 XP, +25 PRI), unlocks badges, and gets next-stage recommendations.

### Recruiter Journey
1.  **Access Hub**: Recruiter logs in, enters verification details, and receives OTP confirmation.
2.  **Talent Search**: Filters candidates by target roles, skills, and verified Placement Readiness Index (PRI) index score.
3.  **Audit candidate profiles**: Evaluates candidates' verified portfolio repositories, verified mock interview histories, and ATS scores.
4.  **Direct Contact**: Reaches out to candidates who cleared the platform thresholds.

### Administrator Journey
1.  **Ingestion**: Administrative coordinator enters a job URL. The scraper crawls details and populates job posts.
2.  **Mock Templates**: Coordinator modifies progressive mock templates (Level 1-5 blueprinted questions).
3.  **Readiness Audit**: Overview candidate global diagnostics (Average ATS scores, active students, popular company tracks).
4.  **Security Audit**: Inspects system telemetry logs, cost analytics, and flags community reports.

### Mentor Journey
1.  **Availability setup**: Mentors configure session slots (e.g., system design, resume review).
2.  **Bookings handling**: Receives student request triggers and clicks accept.
3.  **Reviews submission**: Submits quantitative grades and qualitative feedback.

---

## 4. Module Breakdown

### 1. Resume OS
- **ATS Core Scanner**: Full parser returning format feedback, spelling reviews, and overall scores.
- **JD Matcher**: Evaluates matching comparison overlap percentage for target roles.
- **Cache Synchronization**: Automatic sync of the latest resume, invalidating older cached scores.

### 2. Project Advisor OS
- **Discovery Engine**: Dynamic stack selector mapping target tracks (e.g., Trading System -> Goldman Sachs).
- **5-Level FAANG Mock Station**: Progressive rounds containing deep concept questions, mistakes guides, and code design discussions.

### 3. AI Career Navigator
- **Dynamic Stages Accordion**: Evaluates candidate status to draft 5 customizable learning milestones.
- **curated Resource Library**: Curated playlists, sites, and docs.
- **Automatic Progress Verifier**: Auto-checks roadmap steps based on real activity (ATS $\ge 70$, Avg Mock $\ge 60$, Projects $\ge 2$).

### 4. Assessment OS
- **Diagnostic Tests**: Automated evaluations measuring skill proficiency.
- **Typing & Coding tests**: Core algorithm verification.

### 5. Recruiter CRM & Trust Hub
- **Authentication**: LinkedIn OTP confirmation and admin approval loops.
- **Talent pipelines**: Filterable student pools sorting by PRI score.

### 6. Mentorship OS
- **Booking calendar**: Session requests, active schedules, and review submissions.

### 7. Community Hub
- **Social forum**: Posts, comments, upvoting, report auditing, and participation XP.
