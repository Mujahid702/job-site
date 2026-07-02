# Developer Onboarding & Getting Started Guide

Welcome to the team! This guide will help you install the required software, initialize your environment, configure databases, and start contributing to BuggedBrain within 15–20 minutes.

---

## 1. Project Overview & Vision

### Vision
BuggedBrain is a SaaS platform designed to bridge the gap between academic projects and FAANG recruitment standards. It operates as an AI-powered Career and Portfolio Mentor.

### Target Users
-   **Students (Candidates)**: Build portfolios, pass mock technical rounds, and track placement index readiness.
-   **Recruiters**: Search a directory of verified candidates with credentials validated by platform activities.
-   **Admins / Coordinators**: Monitor campus drives, run job crawlers, and configure systems templates.
-   **Mentors**: Host booking slots and submit candidate feedback evaluations.

### High-Level Architecture
BuggedBrain is built with a Next.js 16 (Turbopack) frontend and utilizes Supabase as a backend relational database, Upstash Redis as a caching layer, and the AI Gateway Router to balance queries across Gemini, Groq, and OpenRouter.

---

## 2. Required Software & Version Matrix

Please ensure your local workstation has these exact software versions:

-   **Node.js**: `v18.0.0` to `v20.x` (LTS recommended)
-   **npm**: `v9.x` or higher
-   **Git**: `v2.30.0` or higher
-   **PostgreSQL**: `v14` or higher (optional if using local DB client)
-   **Supabase CLI**: For database sync checks (optional)
-   **VS Code**: Preferred IDE (recommended extensions: ESLint, Tailwind CSS, Prettier)

---

## 3. Local Development Setup

Follow these steps to configure your environment:

### Step 1: Clone the Repository
```bash
git clone https://github.com/Mujahid702/job-site.git
cd job-site
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*Modify `.env.local` to input your Supabase connection parameters, Redis credentials, and Gemini API keys.*

### Step 4: Run Database Migrations
Go to your **Supabase Project SQL Editor** and execute the migration files in this order:
1.  `supabase_persistence.sql`: Set up base user profiles, snapshots, and placement index tables.
2.  `supabase_projects.sql`: Seed Target Company priority skill maps.
3.  `supabase_projects_templates_v2.sql`: Seed Project Advisor blueprints.

### Step 5: Start Development Server
```bash
npm run dev
```
*(The pre-hook automatically runs `node scripts/verify-env.js` to verify required keys).*

---

## 4. Local Environment Variables Reference

| Variable Name | Purpose | Scope / Usage | Required? |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Postgres Connection string | Direct Supabase schema migrations | Optional (Recommended for backend tools) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint URL | Client-side database actions and authentication | **Required** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon token key | Safe public data fetches | **Required** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Admin bypass token | Bypass RLS constraints for admin tasks | Optional (Admin tools only) |
| `UPSTASH_REDIS_REST_URL` | Redis Cache REST URL | Key-value data lookups for RAG & AI Router | **Required** |
| `UPSTASH_REDIS_REST_TOKEN` | Redis Access Token | Client verification for Upstash calls | **Required** |
| `GEMINI_API_KEY` | Google Gemini API Key | Primary AI generator for scan evaluations | **Required** |
| `GROQ_API_KEY` | Groq API Key | High-speed, low-latency failover mock rounds | Optional |
| `OPENROUTER_API_KEY` | OpenRouter access token | Claude/GPT gateway fallback | Optional |
| `NEXTAUTH_SECRET` | Auth Token Encryption Hash | NextAuth token checks | Optional |

---

## 5. Common Development Commands

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Startup Dev** | `npm run dev` | Boots Next.js dev server (with pre-run env checks) |
| **Type Check** | `npx tsc --noEmit` | Compiles type checks |
| **Production Build** | `npm run build` | Builds highly optimized static and dynamic routes |
| **Start Production** | `npm run start` | Boots production server |
| **Lint checks** | `npm run lint` | Inspects code styling against rules |

---

## 6. Common Errors Troubleshooting

### 1. Supabase Connection Issues
*   **Symptom**: Console logs `Error: supabase.auth.getUser() failed` or DB fetches return undefined.
*   **Resolution**: Verify that `NEXT_PUBLIC_SUPABASE_URL` has no trailing slashes and that your `NEXT_PUBLIC_SUPABASE_ANON_KEY` has not expired in your Supabase dashboard settings.

### 2. Upstash Redis Caching Failures
*   **Symptom**: AI logs report `[AI Cache] Failed to read cache...` or rate limit errors.
*   **Resolution**: Ensure `UPSTASH_REDIS_REST_URL` starts with `https://` and that you copied the complete token string.

### 3. Missing API Keys blockages
*   **Symptom**: The Dev server fails to start, logging: `✖ ENVIRONMENT ERROR: Missing Required Variables!`.
*   **Resolution**: Check `.env.local` for placeholders (e.g. `[ref]`). Replace them with valid credentials.

---

## 7. System Debugging Guide

### How to Inspect API Routes
Next.js server logs print directly to the terminal where `npm run dev` is running. Look for `[API LOG]` headers or trace routes in your browser's Developer Tools network tab.

### How to Inspect the AI Router
Add console traces in `lib/ai/router.ts`. The AI Gateway prints cache statuses (`[AI Cache Hit]`) or failover triggers (`[AI Router] Attempting failover to...`).

### How to Inspect RAG and Redis
Check cached tokens or document index lookups via the Upstash Redis Online Console under search indices keys.
