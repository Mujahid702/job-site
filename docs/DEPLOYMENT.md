# Deployment & Operations Guide

This document describes environment configuration settings, Supabase SQL migration procedures, and production release checklists.

---

## 1. Cloud Hosting Configuration (Vercel)

BuggedBrain is optimized for hosting on **Vercel** serverless environments:

1.  **Project Settings**:
    - **Framework Preset**: Next.js
    - **Root Directory**: `./`
    - **Build Command**: `npm run build`
    - **Output Directory**: `.next`
2.  **Edge Functions**:
    - Rate limiters and geolocation telemetry handlers utilize Vercel Edge Middleware.

---

## 2. Supabase SQL Migration Flow

Database migrations must follow these steps before deploying production bundles:

1.  **Local Schema Verification**: Inspect local SQL files in the root folder (e.g. `supabase_persistence.sql`, `supabase_projects.sql`).
2.  **Staging Test**: Apply migration scripts to the staging Supabase project database.
3.  **Production Release**: Execute SQL queries in the production database console. Ensure all RLS policies are enabled:
    ```sql
    ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
    ```
4.  **Verification**: Test endpoints utilizing the updated columns to verify query resolutions.

---

## 3. Upstash Redis Setup

Redis acts as our caching proxy layer:

1.  Create an Upstash Redis database.
2.  Retrieve `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3.  Define them in Vercel settings and `.env.local` to enable caching of high-latency AI requests.

---

## 4. Production Release Checklist

Before merging a `release/*` branch into `main` and deploying to production, the developer must verify the checklist:

- [ ] **TypeScript Check**: Run `npx tsc --noEmit` locally. There must be zero type compilation errors.
- [ ] **Production Build**: Execute `npm run build`. Confirm page generation completes successfully.
- [ ] **Env Verification**: Run `node scripts/verify-env.js` to ensure Vercel configuration matches local settings.
- [ ] **Database RLS Check**: Verify RLS policies are active and that no tables permit unrestricted read/write.
- [ ] **API Security Check**: Verify all `/api/admin/*` routes are protected with `is_admin()` validation.
- [ ] **Sentry Telemetry**: Verify error capturing configs are active and error boundaries catch render crashes.
- [ ] **Visual Design**: Ensure visual layouts follow the [Design System](file:///docs/DESIGN_SYSTEM.md) parameters.
