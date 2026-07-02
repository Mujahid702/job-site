# Long-Term System Scalability & Observability Guide

This planning guide outlines architecture patterns, database structures, queue patterns, and telemetry requirements to scale BuggedBrain as traffic increases.

---

## 1. Directory Structure Organization at Scale

As the codebase expands, group folders by feature domain:

```
src/
├── app/               (Next.js Route controllers & layout settings)
├── features/          (Self-contained domain folders)
│   ├── resume-os/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── project-os/
│   └── recruiter-crm/
├── shared/            (Stateless, reusable UI and utilities)
│   ├── components/
│   ├── utils/
│   └── styles/
```
*Rule*: Feature-specific components must reside within their feature folder, keeping the `shared/` directory clean.

---

## 2. Database Partitioning considerations

High-frequency telemetry tables (`public.analytics_events` and `public.audit_logs`) will grow rapidly:
-   **Action**: Implement Postgres table partitioning on the `created_at` timestamp.
-   **Structure**: Partition tables monthly (e.g., `analytics_events_2026_07`, `analytics_events_2026_08`).
-   **Benefits**: Keeps query indices fast, bounds table scanning operations, and allows dropping legacy partitions.

---

## 3. Background Job & Message Queues Architecture

For tasks that take a long time to run (like generating PDF resumes, parsing large files, or sending emails), don't process them in the HTTP request thread:

```
[API route] ──> [Publish Job Event] ──> [BullMQ / Redis Message queue] ──> [Worker process]
```
-   **Queue Engine**: BullMQ backed by Upstash Redis.
-   **Workers**: Deploy separate serverless functions or worker nodes to subscribe to queues, handle job processes, and save results back to Supabase.
-   **Benefits**: Lowers API response time and prevents request timeouts.

---

## 4. Microservice Migrations Scoping

When feature workloads diverge, consider migrating monolithic routes into independent services:
-   **ATS Parser Service**: Move PDF text extraction and analysis to a Go or Python microservice. This reduces node memory usage in Next.js serverless functions.
-   **Code Sandbox Sandbox**: Run WebAssembly algorithm tests inside isolated Docker containers to protect primary system endpoints.

---

## 5. Security Hardening

-   **WAF (Web Application Firewall)**: Place cloud platforms behind Cloudflare WAF to prevent brute force login attempts and DDoS attacks.
-   **CSRF Checks**: Enable cross-site request forgery checks on mutative POST APIs.
-   **Secrets rotation**: Use AWS Secrets Manager or HashiCorp Vault to rotate system credentials every 90 days.
