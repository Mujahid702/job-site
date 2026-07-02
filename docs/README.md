# BuggedBrain Developer Documentation Center

Welcome to the central developer documentation hub for BuggedBrain. This directory acts as the single source of truth for repository guidelines, system architectures, database schemas, and parallel workflow standards.

## Documentation Catalog Index

Please read the specific documentation sheets linked below before contributing code:

### 1. Product & Architecture Core
*   **[Product Requirement Document (PRD)](file:///c:/Users/mujah/job-site/docs/PRD.md)**: Vision, mission, target audience, and detailed persona journeys.
*   **[System Architecture Guide](file:///c:/Users/mujah/job-site/docs/ARCHITECTURE.md)**: Main folder structures, layer boundaries, and file organization rules.
*   **[AI Gateway Architecture](file:///c:/Users/mujah/job-site/docs/AI_ARCHITECTURE.md)**: AI routing gateway logic, Gemini/Groq/OpenRouter setups, failover adapters, Upstash token caching, and cost logging telemetry.

### 2. Database & API References
*   **[Database Catalog](file:///c:/Users/mujah/job-site/docs/DATABASE.md)**: Tables, columns, triggers, functions, indexes, and Row Level Security (RLS) policies.
*   **[API Catalog Reference](file:///c:/Users/mujah/job-site/docs/API.md)**: System endpoints, parameter validation objects, headers, status codes, and security.

### 3. Workflows & Guidelines
*   **[Contributing Guide & Git Workflows](file:///c:/Users/mujah/job-site/docs/CONTRIBUTING.md)**: Branch strategies (`feature/*`), Pull Request checklists, code review standards, and task managers layout.
*   **[Coding Guidelines](file:///c:/Users/mujah/job-site/docs/CODING_GUIDELINES.md)**: TypeScript guidelines, component limits, error handling conventions, and query security locks.
*   **[Deployment Operations Guide](file:///c:/Users/mujah/job-site/docs/DEPLOYMENT.md)**: Vercel settings, Supabase sync steps, and staging verification checklists.

### 4. Project State
*   **[Module Status Dashboard](file:///c:/Users/mujah/job-site/docs/MODULE_STATUS.md)**: Completion percentages, ownership structures (Developer A / B), and future scope updates.
*   **[Strategic Roadmap](file:///c:/Users/mujah/job-site/docs/docs/ROADMAP.md)**: Platform phases and upcoming releases.
*   **[System Changelog](file:///c:/Users/mujah/job-site/docs/CHANGELOG.md)**: Evolution histories and recent upgrades updates.

---

## Workspace Quick Start

1. Ensure you have Node.js 18+ and a local `.env.local` configured.
2. Initialize environment checks:
   ```bash
   npm run dev
   ```
   *(The pre-hook automatically runs `node scripts/verify-env.js` to assert key presences).*
3. Run types verification locally:
   ```bash
   npx tsc --noEmit
   ```
4. Verify build compilation:
   ```bash
   npm run build
   ```
