# BuggedBrain Placement OS — Requirements Document

> **Version**: 1.0  
> **Last Updated**: August 2026  
> **Platform**: Next.js 16 App Router, deployed on Vercel  
> **Target Audience**: Class of 2026 engineering graduates, VTU students, off-campus placement seekers

---

## 1. Product Overview

BuggedBrain Placement OS is a SaaS-grade AI-powered career placement platform that guides college students from an unpolished resume to a corporate offer. The system combines AI tools, gamification, a recruiter CRM, community features, a subscription paywall, and an admin control plane into a single Next.js monorepo.

A secondary sub-system, **VTU SmartPrep AI** (`vtu_portal/`), is a Python FastAPI service for Visvesvaraya Technological University exam preparation and runs independently from the main Next.js application.

---

## 2. Functional Requirements

### 2.1 Authentication & Onboarding

| ID | Requirement | Status |
|----|-------------|--------|
| AUTH-01 | Users can register and log in via email/password using Supabase Auth | Implemented |
| AUTH-02 | Google OAuth sign-in is supported via Supabase provider | Implemented |
| AUTH-03 | Microsoft/Outlook OAuth is supported for email integration | Implemented |
| AUTH-04 | Session management uses cookie-based Supabase SSR client | Implemented |
| AUTH-05 | Account deletion is a first-class user action | Implemented |
| AUTH-06 | A pre-built `verifyAdmin()` guard protects all admin API routes | Implemented |
| ON-01 | New users complete an 11-step onboarding wizard before reaching the dashboard | Implemented |
| ON-02 | Onboarding captures: college, CGPA, branch, graduation year, target role, skills, LinkedIn URL | Implemented |
| ON-03 | Resume upload during onboarding triggers an AI ATS pre-scan via the client-side task queue | Implemented |
| ON-04 | Onboarding state (`onboarding_step`, `onboarding_completed`) is persisted in `profiles` table | Implemented |

### 2.2 Role-Based Access Control (RBAC)

| ID | Requirement | Status |
|----|-------------|--------|
| RBAC-01 | The system supports 10 roles: `student`, `recruiter`, `mentor`, `moderator`, `content_manager`, `assessment_manager`, `placement_coordinator`, `support_executive`, `admin`, `super_admin` | Implemented |
| RBAC-02 | Roles map to 9 permissions: `use:platform`, `view:analytics`, `manage:ai`, `manage:payments`, `impersonate:user`, `audit:logs`, `verify:recruiters`, `edit:assessments`, `edit:jobs` | Implemented |
| RBAC-03 | Role resolution checks `user_roles` DB table first, then falls back to `user_metadata.role` | Implemented |
| RBAC-04 | `super_admin` emails are hardcoded as an emergency bypass in `lib/auth.ts` | Implemented |
| RBAC-05 | `hasPermission(user, permission)` is the single authorisation check used across the codebase | Implemented |

### 2.3 Resume OS

| ID | Requirement | Status |
|----|-------------|--------|
| RES-01 | ATS Analyzer scores resumes on 7 dimensions: completeness, keywords, skills, projects, readability, formatting, impact | Implemented |
| RES-02 | JD Matcher compares a resume against a pasted job description and highlights keyword gaps | Implemented |
| RES-03 | AI Resume Enhancer rewrites weak bullet points using STAR-framed high-impact language | Implemented |
| RES-04 | Resume Builder generates structured resume blueprints from profile data | Implemented |
| RES-05 | Version Comparison Engine diffs two resume versions and shows ATS score variance | Implemented |
| RES-06 | SVG-drawn analytics visualise historical ATS and role-fit score trends | Implemented |
| RES-07 | All resume scan results are persisted in `resume_scans` and `resume_analytics` tables | Implemented |
| RES-08 | PDF and DOCX file formats are both accepted for upload | Implemented |
| RES-09 | ATS and JD match responses are cached in Redis for 24 hours to reduce AI cost | Implemented |

### 2.4 Assessment OS

| ID | Requirement | Status |
|----|-------------|--------|
| ASS-01 | Platform supports 5 assessment categories: Aptitude, Logical, Verbal, SQL, Coding | Implemented |
| ASS-02 | 100+ topics are seeded in `assessment_topics`; topics link to categories | Implemented |
| ASS-03 | Admin-created company mock test templates include timing, passing threshold, and attempt limits | Implemented |
| ASS-04 | Questions support difficulty levels, marks, and negative marking | Implemented |
| ASS-05 | Test attempts, per-question answers, and final results are persisted | Implemented |
| ASS-06 | Per-user, per-topic mastery progress is tracked in `assessment_progress` | Implemented |
| ASS-07 | Leaderboards and certificates are generated on test completion | Implemented |
| ASS-08 | AI feedback is generated post-test, identifying weak concepts and recommending practice | Implemented |
| ASS-09 | Coding questions use Monaco Editor in the browser | Implemented |
| ASS-10 | Code submissions are compiled and executed via `POST /api/assessment/compiler` | Implemented |
| ASS-11 | SQL questions run in a client-side sandbox powered by `sql.js` | Implemented |

### 2.5 AI Mock Interview Simulator

| ID | Requirement | Status |
|----|-------------|--------|
| INT-01 | Interview simulator supports Practice Mode (per-question feedback) and Exam Mode (batch evaluation) | Implemented |
| INT-02 | Browser webcam is requested to simulate a real interview environment | Implemented |
| INT-03 | Speech-to-text via `webkitSpeechRecognition` allows spoken answers | Implemented |
| INT-04 | AI scores answers across 5 parameters: Technical Accuracy, Communication, Clarity, Completeness, Confidence | Implemented |
| INT-05 | STAR analysis checks for Situation, Task, Action, Result structure in behavioural answers | Implemented |
| INT-06 | Filler word detector counts frequency of "um", "like", "so", "basically" etc. | Implemented |
| INT-07 | Each evaluated answer returns a model ideal answer | Implemented |

### 2.6 LinkedIn OS

| ID | Requirement | Status |
|----|-------------|--------|
| LIN-01 | Headline Generator produces conservative, professional, and brand-specific variants | Implemented |
| LIN-02 | Outreach Assistant generates connection request, cold pitch, and referral request templates | Implemented |
| LIN-03 | Content Creator drafts posts for project completions, hackathons, and coding streaks | Implemented |
| LIN-04 | Profile analyzer imports data from the student's Resume OS profile | Implemented |
| LIN-05 | LinkedIn OS responses are cached in Redis for 24 hours | Implemented |
| LIN-06 | LinkedIn OS is feature-flagged (`productionVisible: false`) and requires launch approval | Implemented |

### 2.7 Placement Tracker OS (Recruiter CRM)

| ID | Requirement | Status |
|----|-------------|--------|
| CRM-01 | Kanban board tracks applications through 9 pipeline stages: Saved → Applied → Assessment Scheduled → Assessment Completed → Technical Interview → HR Interview → Offer Received → Joined → Rejected/Withdrawn | Implemented |
| CRM-02 | Application history is recorded as a timestamped timeline in `application_history` | Implemented |
| CRM-03 | Calendar matrix view shows scheduled assessments and interviews | Implemented |
| CRM-04 | Offer comparison tool evaluates multiple offers side by side | Implemented |
| CRM-05 | Recruiter CRM manages contacts with `relationship_strength`, `pipeline_stage`, activities, and follow-up scheduling | Implemented |
| CRM-06 | AI generates outreach email templates in the recruiter template editor | Implemented |
| CRM-07 | Bulk recruiter import is supported via `POST /api/recruiter/import` | Implemented |
| CRM-08 | Placement Tracker is feature-flagged (`productionVisible: false`) pending production launch | Implemented |

### 2.8 AI Placement Copilot

| ID | Requirement | Status |
|----|-------------|--------|
| COP-01 | Copilot is a RAG-augmented chat assistant for placement guidance | Implemented |
| COP-02 | The knowledge base uses PGVector (`vector(768)`) with HNSW cosine similarity search | Implemented |
| COP-03 | Admin can upload documents to the knowledge base via `/admin/knowledge` | Implemented |
| COP-04 | Copilot conversation history and token/cost per session are stored in `copilot_interactions` | Implemented |
| COP-05 | Rate limit: 50 requests/hour per user | Implemented |

### 2.9 Mentorship OS

| ID | Requirement | Status |
|----|-------------|--------|
| MEN-01 | Mentor marketplace is admin-managed with mentor profiles, skills, pricing type (FREE/PAID/PREMIUM), and trust score | Implemented |
| MEN-02 | Students can browse, filter, and book mentor slots | Implemented |
| MEN-03 | Bookings cycle through statuses: Upcoming → Completed/Cancelled/Rescheduled | Implemented |
| MEN-04 | Post-session 4-dimension reviews (communication, knowledge, helpfulness, advice) update the mentor trust score via PostgreSQL triggers | Implemented |
| MEN-05 | Session notes capture feedback, roadmap items, and shared resources (jsonb) | Implemented |
| MEN-06 | Mentor demand requests allow students to nominate new mentors | Implemented |
| MEN-07 | Mentorship OS is feature-flagged (`productionVisible: false`) pending video calling integration | Planned |

### 2.10 Portfolio OS

| ID | Requirement | Status |
|----|-------------|--------|
| POR-01 | 5 portfolio themes are seeded: Modern, Glassmorphism, Minimal, Developer, Startup Founder | Implemented |
| POR-02 | AI generates a `structured_schema` JSON containing all portfolio sections from profile data | Implemented |
| POR-03 | GitHub and LinkedIn data can be synced into the portfolio generator | Implemented |
| POR-04 | Generated portfolios are publicly viewable at `/portfolio/[id]` | Implemented |
| POR-05 | Portfolio OS is feature-flagged (`productionVisible: false`) | Implemented |

### 2.11 Projects OS

| ID | Requirement | Status |
|----|-------------|--------|
| PRJ-01 | AI generates company-specific project blueprints targeting 31 seeded companies (Google, Amazon, TCS, etc.) | Implemented |
| PRJ-02 | Project blueprints are stored as jsonb in `student_projects` | Implemented |
| PRJ-03 | Admin can manage project templates via `/admin/projects` | Implemented |

### 2.12 Cover Letter OS

| ID | Requirement | Status |
|----|-------------|--------|
| CVL-01 | AI generates personalised cover letters from profile + job description inputs | Implemented |
| CVL-02 | Rate limit: 5 cover letters per month on the Free plan | Implemented |

### 2.13 Career Roadmap Navigator

| ID | Requirement | Status |
|----|-------------|--------|
| ROD-01 | Interactive flowchart roadmap renders predefined career paths (SDE, AI/ML, Cloud, etc.) | Implemented |
| ROD-02 | Step completion is persisted in `roadmap_progress` | Implemented |
| ROD-03 | Roadmap milestones feed into the Placement Readiness Index score | Implemented |
| ROD-04 | Roadmap feature is flagged (`productionVisible: false`) pending visual upgrade | Planned |

### 2.14 Company Prep

| ID | Requirement | Status |
|----|-------------|--------|
| COM-01 | Company-specific prep content is available for major hiring companies | Implemented |
| COM-02 | Admin can manage prep content from `/admin/company-prep` | Implemented |
| COM-03 | Company Prep is feature-flagged (`productionVisible: false`) | Implemented |

### 2.15 Placement Readiness Index (PRI)

| ID | Requirement | Status |
|----|-------------|--------|
| PRI-01 | PRI is a 0–100 composite score synthesizing: resume health (40%), mock interview score (30%), roadmap milestones (15%), daily goals (15%) | Implemented |
| PRI-02 | PRI persists in the `placement_readiness` table with 8 component sub-scores | Implemented |
| PRI-03 | Users receive a classification level (Placement Beginner → Interview Ready → Placement Elite) | Implemented |
| PRI-04 | Mission bonuses and XP rewards contribute to PRI uplift | Implemented |
| PRI-05 | PRI feature is flagged (`productionVisible: false`) pending cohort comparison refinement | Planned |

### 2.16 Gamification (Missions & XP)

| ID | Requirement | Status |
|----|-------------|--------|
| GAM-01 | Daily, weekly, and career missions are managed in `placement_missions` | Implemented |
| GAM-02 | Mission progress is tracked per user in `user_missions` with a `claimed` flag | Implemented |
| GAM-03 | XP is accumulated in `user_xp` with `total_xp`, `current_level`, `streak_days`, `longest_streak` | Implemented |
| GAM-04 | All XP rewards are logged in `career_ledger` for auditability | Implemented |
| GAM-05 | A public XP leaderboard is available at `/dashboard/leaderboard` | Implemented |

### 2.17 Community

| ID | Requirement | Status |
|----|-------------|--------|
| CMT-01 | Students can create posts, comment, and upvote in the community forum | Implemented |
| CMT-02 | Posts can be reported; moderation queue is available to admins at `/admin/moderation` | Implemented |
| CMT-03 | Community groups are unlock-gated (min ATS score, onboarding completion requirements) | Implemented |
| CMT-04 | Events and registrations are managed in `community_events` / `community_event_registrations` | Implemented |

### 2.18 Referral & Growth System

| ID | Requirement | Status |
|----|-------------|--------|
| REF-01 | Full referral funnel is tracked in `referrals` with fraud detection fields | Implemented |
| REF-02 | Reward rules are configurable in `referral_reward_rules` | Implemented |
| REF-03 | Spam flags are stored in `referral_spam_flags` | Implemented |
| REF-04 | Ambassador program is managed from `/admin/ambassadors` | Implemented |

### 2.19 Subscription & Payments

| ID | Requirement | Status |
|----|-------------|--------|
| SUB-01 | Platform offers 4 subscription tiers: Free, Starter ($9.99/mo), Pro ($29.99/mo), Ultimate ($79.99/mo) | Implemented |
| SUB-02 | Billing cycles: monthly, yearly, lifetime | Implemented |
| SUB-03 | Razorpay is the primary payment provider (INR-focused) | Implemented |
| SUB-04 | Stripe is the secondary payment provider (USD) | Implemented |
| SUB-05 | Both providers support sandbox simulation mode when API keys are absent | Implemented |
| SUB-06 | Payment verification uses HMAC signature for Razorpay; session status for Stripe | Implemented |
| SUB-07 | Feature usage limits are enforced per plan via the `feature_usage` table and billing period | Implemented |
| SUB-08 | Expired subscriptions are automatically downgraded to Free on next access | Implemented |
| SUB-09 | Admin can trigger refunds from `/admin/subscriptions` | Implemented |
| SUB-10 | Monthly usage counters are reset via cron at `POST /api/cron/reset-usage` | Implemented |

### 2.20 Gmail & Outlook Integration

| ID | Requirement | Status |
|----|-------------|--------|
| EML-01 | Gmail OAuth connection allows the system to ingest application update emails | Implemented |
| EML-02 | AI classifies ingested emails with `confidence_score` and extracts entities (company, status, date) | Implemented |
| EML-03 | Ingestion logs are stored in `email_ingestion_logs` | Implemented |
| EML-04 | Outlook OAuth is supported for email + calendar sync | Implemented |

### 2.21 WhatsApp Integration

| ID | Requirement | Status |
|----|-------------|--------|
| WA-01 | Admin can broadcast job postings to students via WhatsApp Business API | Implemented |
| WA-02 | WhatsApp broadcast panel is available at `/admin/whatsapp` | Implemented |
| WA-03 | Job postings store `whatsapp_message` and `template_used` columns for tracking | Implemented |

### 2.22 Admin Control Plane

| ID | Requirement | Status |
|----|-------------|--------|
| ADM-01 | All admin routes require `admin` or `super_admin` role verified against `user_roles` table | Implemented |
| ADM-02 | Admin can create, edit, and delete job postings | Implemented |
| ADM-03 | Admin can manage assessments and knowledge base documents | Implemented |
| ADM-04 | Admin can view AI analytics: provider usage, token costs, cache hit rates | Implemented |
| ADM-05 | Admin can view platform analytics: daily/monthly aggregates, error logs, performance metrics | Implemented |
| ADM-06 | Admin can manage subscriptions, view revenue, and trigger refunds | Implemented |
| ADM-07 | Feature flags are togglable from `/admin/developer` (DB-persisted via `feature_flags` table) | Implemented |
| ADM-08 | Full audit log of admin actions is persisted in `audit_logs` | Implemented |
| ADM-09 | Admin can manage mentor marketplace and institution listings | Implemented |
| ADM-10 | Scrape-URL utility at `POST /api/admin/scrape-url` is available for content ingestion | Implemented |

### 2.23 VTU SmartPrep AI Sub-System

| ID | Requirement | Status |
|----|-------------|--------|
| VTU-01 | A separate Python FastAPI service ingests VTU exam PDFs using OCR | Implemented |
| VTU-02 | Importance scoring weights PYQs by frequency, marks, recency, and syllabus coverage | Implemented |
| VTU-03 | RAG tutoring answers exam questions with ChromaDB vector store + citation links | Implemented |
| VTU-04 | The VTU sub-system runs in Docker and is fully isolated from the Next.js monolith | Implemented |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-P1 | AI responses for ATS, JD match, LinkedIn OS, and resume enhance are cached in Redis for 24 hours (SHA256 keyed by prompt + user ID) |
| NFR-P2 | Long AI processing cycles run through a client-side task queue (`lib/queue.ts`) to avoid blocking main thread |
| NFR-P3 | All API routes apply Upstash sliding-window rate limiting with in-memory fallback |
| NFR-P4 | Rate limits by action: ATS/JD/Enhance/Builder — 20 req/hour; Copilot/Insights/Scrape — 50 req/hour; default — 60 req/hour |
| NFR-P5 | Remote images are served via Unsplash (whitelisted in `next.config.ts`) |

### 3.2 Reliability & Resilience

| ID | Requirement |
|----|-------------|
| NFR-R1 | AI gateway provides automatic 3-provider failover: Gemini (primary) → Groq → OpenRouter |
| NFR-R2 | Redis unavailability falls back to in-memory `MemoryCache` |
| NFR-R3 | Upstash rate limiter unavailability falls back to `InMemoryRateLimiter` |
| NFR-R4 | Payment adapters simulate sandbox mode when API keys are absent |
| NFR-R5 | Pre-dev and pre-build scripts (`scripts/verify-env.js`) validate required environment variables |

### 3.3 Security

| ID | Requirement |
|----|-------------|
| NFR-S1 | All database tables enforce Row Level Security (RLS) — users can only access their own data |
| NFR-S2 | Admin bypass uses the `is_admin()` PostgreSQL function checking `raw_user_meta_data` |
| NFR-S3 | The `user_roles` table is the authoritative source for admin/super_admin role assignments |
| NFR-S4 | All admin API routes call `verifyAdmin()` which checks both session validity and DB role |
| NFR-S5 | NEXTAUTH_SECRET is used for JWT signing; must be a strong random value in production |
| NFR-S6 | Sentry (`@sentry/nextjs`) captures errors on client, server, and edge runtimes |
| NFR-S7 | Input validation on all API routes uses Zod v4 schemas |

### 3.4 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SC1 | Stateless serverless architecture — all API routes are Next.js Route Handlers compatible with Vercel edge/serverless |
| NFR-SC2 | AI cost telemetry is logged per-call to `ai_usage_logs` for capacity planning |
| NFR-SC3 | Feature usage counters enable per-user throttling independent of rate limiting |

### 3.5 Observability

| ID | Requirement |
|----|-------------|
| NFR-O1 | `lib/telemetry.ts` provides `logError()` and `logPerformance()` writing to `error_logs` and `performance_metrics` |
| NFR-O2 | `feature_telemetry` table tracks feature adoption |
| NFR-O3 | AI usage analytics are surfaced in the admin panel at `/admin/ai-analytics` |
| NFR-O4 | All AI provider calls log provider, model, tokens, cost, response time, and user ID |

---

## 4. Feature Flag Registry

Flags are defined in `lib/featureFlags.ts` and evaluated at render time. Admins always bypass all flags.

| Feature | Production Visible | Est. Launch | Status |
|---------|-------------------|-------------|--------|
| `dashboard` | Yes | Live | Live |
| `resume-os` | Yes | Live | Live |
| `assessment-os` | Yes | Live | Live |
| `projects-os` | Yes | Live | Live |
| `recommended` | Yes | Live | Live |
| `placement-missions` | Yes | Live | Live |
| `actions` | Yes | Live | Live |
| `cover-letter-os` | Yes | Live | Live |
| `community` | Yes | Live | Live |
| `community-hub` | Yes | Live | Live |
| `placement-readiness` | No | 2026-09-01 | Under enhancement |
| `roadmap` | No | 2026-10-15 | Under enhancement |
| `company` | No | 2026-08-30 | Under enhancement |
| `placement-tracker` | No | 2026-09-15 | Under enhancement |
| `recruiters` | No | 2026-09-30 | Under enhancement |
| `portfolio-os` | No | 2026-08-15 | Under enhancement |
| `linkedin-os` | No | 2026-08-20 | Under enhancement |
| `placement-copilot` | No | 2026-10-01 | Under enhancement |
| `interview-prep` | No | 2026-11-01 | Under enhancement |
| `mentorship-os` | No | 2026-10-10 | Under enhancement |
| `membership` | No | TBD | Under enhancement |

---

## 5. Subscription Plan Feature Matrix

| Feature | Free | Starter | Pro | Ultimate |
|---------|------|---------|-----|---------|
| ATS Scans / month | 3 | 10 | Unlimited | Unlimited |
| JD Matches / month | 3 | 10 | Unlimited | Unlimited |
| Resume Builder / month | 1 | 5 | Unlimited | Unlimited |
| Resume Enhancer / month | 2 | 10 | Unlimited | Unlimited |
| Cover Letters / month | 5 | 15 | Unlimited | Unlimited |
| Mock Interviews | Limited | 30 min | Unlimited | Unlimited |
| Priority AI | No | No | Yes | Yes |
| Storage | Default | Default | 2 GB | 10 GB |
| Price (monthly) | $0 | $9.99 | $29.99 | $79.99 |

---

## 6. API Surface (Key Endpoints)

### Public / Authenticated
- `POST /api/resume/evaluate` — ATS score + profile parse
- `POST /api/resume/jd-match` — JD keyword match
- `POST /api/resume/enhance` — AI bullet rewriter
- `POST /api/resume/builder` — Resume generation
- `POST /api/resume/interview` — Interview answer evaluation
- `POST /api/assessment/compiler` — Code execution
- `POST /api/assessment/sql` — SQL sandbox
- `POST /api/copilot/chat` — RAG-augmented copilot
- `POST /api/cover-letter` — Cover letter generation
- `POST /api/linkedin` — LinkedIn analysis/optimization
- `POST /api/placement/gmail` — Gmail email ingestion
- `GET /api/student/placement-probability` — ML placement score
- `POST /api/subscriptions/checkout` — Create payment order
- `POST /api/subscriptions/verify` — Verify payment

### Admin Only
- `POST /api/admin/create-job` / `POST /api/admin/generate-job`
- `GET/POST /api/admin/knowledge` — RAG knowledge base management
- `GET /api/admin/ai-analytics` — AI cost and usage dashboard
- `GET /api/admin/revenue` — Subscription revenue
- `GET/PUT /api/admin/feature-flags` — Feature flag management
- `POST /api/admin/refund` — Payment refund

---

## 7. Environment Variables

All variables must be present in `.env.local`. The pre-dev script `scripts/verify-env.js` validates required keys at startup.

```bash
# Database
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Cache / Rate Limiting
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# AI
GEMINI_API_KEY           # Primary AI provider
GROQ_API_KEY             # Failover 1
OPENROUTER_API_KEY       # Failover 2

# Auth
NEXTAUTH_SECRET
NEXTAUTH_URL

# Payments
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
STRIPE_SECRET_KEY
NEXT_PUBLIC_APP_URL

# OAuth Integrations
LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET
OUTLOOK_CLIENT_ID / OUTLOOK_CLIENT_SECRET

# Messaging
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_API_TOKEN
```

---

## 8. Out of Scope

- Native mobile application (web-only via responsive design)
- Direct video calling infrastructure (planned via Zoom/Google Meet embedding)
- Prisma or any ORM (raw SQL via Supabase client only)
- Multi-tenant institution accounts (single-tenant student-level model)
