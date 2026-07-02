# Production Deployment Readiness Checklist

This document acts as a safety gate. No deployment to production hosting (Vercel/Supabase) is allowed unless every check listed here passes.

---

## 1. Local Code Validation

- [ ] **TypeScript Check**: Execute `npx tsc --noEmit` locally. The type check must succeed with zero compilation errors.
- [ ] **ESLint Audit**: Run `npm run lint`. The code must conform to configuration parameters with no styling warnings.
- [ ] **Next.js Production Build**: Run `npm run build` locally. Verify that both static and server page chunks compile successfully.
- [ ] **Env Verification**: Run `node scripts/verify-env.js` to assert that all required variables exist in the target env settings.

---

## 2. Supabase Database & Security

- [ ] **Migration Check**: Apply SQL migrations (`supabase_persistence.sql`, `supabase_projects.sql`) to the staging database.
- [ ] **RLS Policy Audit**: Execute security query checks. Confirm that RLS is enabled on all tables and users cannot query other users' profiles.
- [ ] **RPC Functions Sync**: Verify that custom functions (`public.is_admin()`) exist in the target database.
- [ ] **Database Connection Pools**: Assert connection limits in API gateways config matches project traffic expectations.

---

## 3. Caching & Third-Party Integrations

- [ ] **Upstash Redis Reachability**: Run connectivity test inside environment. Verify that cache lookups do not log failures.
- [ ] **NextAuth Encryption**: Confirm `NEXTAUTH_SECRET` has a valid high-entropy cryptographical hash in the host environment settings.
- [ ] **AI API Credits**: Check Gemini and Groq account usage logs. Verify that current API limits are sufficient for the production load.
- [ ] **Fallback Presets**: Verify that fallback mock templates match target schemas if models time out.

---

## 4. Telemetry & Monitoring

- [ ] **Sentry Telemetry**: Verify Sentry error captures are configured and error boundaries catch client-side React render crashes.
- [ ] **Cost tracking**: Check cost analytics tables. Ensure queries write to `public.analytics_events`.
- [ ] **Logs Monitoring**: Check dashboard metrics. Verify that API routes latency graphs are available.
