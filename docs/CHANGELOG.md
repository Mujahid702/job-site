# Project Changelog — BuggedBrain

All major updates, structural additions, and fixes to the BuggedBrain codebase are documented in this file.

---

## [v0.3.0] — 2026-07-01 (Current Release)

### Added
- Created a dedicated `/docs` directory mapping PRD, Architecture system layers, Databases, APIs, workflows, and AI Gateways.
- Configured `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/` folder with 6 issue cards (Bug reports, Features request, docs gaps, perf review, security, and enhancements).
- Added `.env.example` environment variables template.
- Implemented environment verification checks inside `scripts/verify-env.js`, checking local credentials and validating environment setup before Next.js startup.
- Registered predev and prebuild hooks in `package.json` to execute environment verification checks automatically.
- Added `drop policy if exists` guards inside `supabase_projects.sql` and `supabase_projects_templates_v2.sql` to make migrations safe and idempotent.

---

## [v0.2.0] — 2026-06-29

### Added
- Overhauled the **FAANG Mock Interview Station** to support 5 progressive Levels (Project Explanation, Tech Understanding, Implementation, Optimization, Advanced Discussion).
- Upgraded mock questions schema outputs in `/api/placement/projects/generate` to return concepts, pitfalls, delivery tips, and production details.
- Overhauled **Project Advisor OS** recommendation engines logic to generate match strength scores and target companies dynamically based on stack properties.
- Redesigned **Career Navigator** roadmap visualizers to render accordions detailing durations, stage-specific resource catalogs, and action checklists.
- Added **Progress Verification Sync**: Checked items are auto-verified based on platform metrics (ATS $\ge 70$, Avg Mock $\ge 60$, Projects $\ge 2$). Manual checks on verified tasks are blocked.
- Added the slide-over **AI Coach drawer panel** pre-populating context query prompts.
- Added celebratory rewards panel unlocking badges and listing engineering manager CV advice.

### Fixed
- Resolved undefined property crashes on `unlockedSkills` key parsing inside `getRecommendationInsights` method.

---

## [v0.1.0] — 2026-06-15

### Added
- Initial setup of Resume OS, Project Advisor OS, and Career Roadmap Navigator presets.
- Setup of Supabase persistence database schemas and RLS security profiles.
- Integrated Upstash Redis caching layer and rate limiter.
