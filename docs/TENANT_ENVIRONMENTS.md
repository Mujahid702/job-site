# Multi-Tenant & Environment Architecture Guide

This document defines the 3-tenant environment hierarchy (**Dev**, **Stage**, and **Prod**) for BuggedBrain Placement OS, detailing deployment lifecycles, branching workflows, testing requirements, and environment isolation.

---

## 1. The 3-Tenant Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. DEV TENANT (Branch: `dev`)                                         │
│  • Primary Purpose: Feature implementations, bug fixes, developer      │
│    unit testing of UI components, and unit/automation scripts.         │
│  • Visual: Amber 'DEV TENANT' floating indicator badge.                │
│  • Integrations: Sandbox mock payments, dev Redis namespace (`dev:*`). │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Pull Request & Merge)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  2. STAGING TENANT (Branch: `stage` / `staging`)                       │
│  • Primary Purpose: User Acceptance Testing (UAT), QA manual review,   │
│    and automated end-to-end regression testing.                        │
│  • Visual: Purple 'STAGE (UAT)' floating indicator badge.              │
│  • Integrations: Production-mirror DB, sandbox payment cards,          │
│    isolated cache (`stage:*`).                                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Release Tag & Sign-off Gate)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  3. PRODUCTION TENANT (Branch: `main`)                                 │
│  • Primary Purpose: Live tenant serving real candidates, recruiters,   │
│    and academic placement drives.                                      │
│  • Visual: Pristine, clean production UI (no indicator).               │
│  • Integrations: Live database with strict RLS, live Razorpay/Stripe,  │
│    production Redis (`prod:*`).                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Comparison Matrix

| Property | Development (`dev`) | Staging / UAT (`stage`) | Production (`prod`) |
| :--- | :--- | :--- | :--- |
| **Git Branch** | `dev` | `stage` / `staging` | `main` |
| **Target Audience** | Developers, Automation Engineers | QA Engineers, Product Managers, UAT Testers | Real Students, Recruiters, Admins |
| **Primary Testing** | Unit tests, UI component tests, API unit checks | Manual UAT, end-to-end regression suites | Smoke checks, live telemetry, synthetic health |
| **Badge Indicator** | 🟡 **DEV TENANT** (Amber) | 🟣 **STAGE (UAT)** (Purple) | *None* (Clean UI) |
| **Database Instance**| Dev Supabase schema / project | Staging Supabase project (Prod mirror) | Live Production Supabase with strict RLS |
| **Redis Namespace** | `dev:*` | `stage:*` | `prod:*` |
| **Payment Mode** | Sandbox simulator | Test cards enabled (Sandbox) | **Live Gateway Only** (Real charges) |
| **Auth Cookie** | `bb_dev_*` | `bb_stage_*` | `bb_prod_*` |
| **Feature Flags** | Experimental modules visible | Pre-release UAT review | Production-ready modules only |
| **Config Template** | `.env.dev.example` | `.env.stage.example` | `.env.prod.example` |

---

## 3. Workflow & Promotion Process

### Step 1: Development & Unit Testing (`dev`)
1. Developer creates a branch off `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/new-assessment-ui
   ```
2. Develop features locally using the Dev tenant profile:
   ```bash
   npm run dev:dev
   ```
3. Run local unit tests and static validation:
   ```bash
   npm run lint
   npx tsc --noEmit
   node scripts/verify-env.js --tenant=dev
   ```
4. Push and open a Pull Request targeting `dev`. The `.github/workflows/deploy-dev.yml` pipeline triggers:
   - Validates code style and TypeScript types.
   - Executes developer unit test suites.
   - Deploys preview to the Dev tenant.

---

### Step 2: User Acceptance Testing (UAT) (`stage`)
1. Once code is stabilized on `dev`, create a promotion Pull Request from `dev` into `stage`:
   ```bash
   git checkout stage
   git pull origin stage
   git merge dev
   ```
2. The `.github/workflows/deploy-stage.yml` pipeline automatically triggers:
   - Validates migration scripts.
   - Executes automated integration and regression suites.
   - Deploys the build to the Staging UAT tenant (`stage.buggedbrain.vercel.app`).
3. **UAT Activities**:
   - QA & stakeholders test new features with realistic candidate profiles.
   - Test sandbox payments using test card numbers.
   - Verify that non-production badge reads **STAGE (UAT)**.
   - Sign off on UAT approval before production release.

---

### Step 3: Live Production Release (`prod`)
1. After UAT sign-off, create a Release Pull Request from `stage` into `main` (or tag a release `v1.x.x`):
   ```bash
   git checkout main
   git pull origin main
   git merge stage
   ```
2. The `.github/workflows/deploy-prod.yml` pipeline triggers:
   - Enforces strict production validation (`--tenant=prod`).
   - Ensures no placeholder or mock credentials exist.
   - Builds optimized production bundle.
   - Deploys to live production (`buggedbrain.vercel.app`).
3. Smoke-test live production endpoints and confirm clean UI without test badges.

---

## 4. Local Development Commands

To run the application locally under specific tenant profiles:

```bash
# Run in Development mode (Amber badge, dev defaults)
npm run dev:dev

# Run in Staging (UAT) simulation mode (Purple badge, UAT testing rules)
npm run dev:stage

# Run in Production simulation mode (Clean UI, strict production rules)
npm run dev:prod

# Verify environment configuration for a specific tenant
node scripts/verify-env.js --tenant=dev
node scripts/verify-env.js --tenant=stage
node scripts/verify-env.js --tenant=prod
```

---

## 5. Cache & Cookie Isolation

To ensure that testing in Dev or Staging never pollutes production data:
1. **Redis Caching**: All keys use [getTenantCacheKey()](file:///c:/Users/mujah/job-site/lib/tenant.ts#L173), prefixing keys with `dev:`, `stage:`, or `prod:`.
2. **Session Cookies**: Authentication cookies use [getTenantCookieName()](file:///c:/Users/mujah/job-site/lib/tenant.ts#L181), keeping logins isolated between `dev`, `stage`, and `prod` tabs.

---

## 6. Emergency Hotfix Protocol

If a critical bug is discovered in live production:
1. Branch directly off `main`:
   ```bash
   git checkout -b hotfix/critical-fix main
   ```
2. Apply the fix and verify locally with `npm run dev:prod`.
3. Open PR to `main` for expedited deployment.
4. **Immediately backport** the fix into `stage` and `dev`:
   ```bash
   git checkout stage && git merge main
   git checkout dev && git merge main
   ```
