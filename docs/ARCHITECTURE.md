# Application Architecture — BuggedBrain

This document describes the technical folder organization, directory rules, component layouts, and state management mechanisms.

---

## 1. System Folder Mappings

To prevent random file placement and maintain consistency, developers must follow this folder guide:

| Directory | Purpose | Rules & Constraints |
| :--- | :--- | :--- |
| **`app/`** | Next.js Router endpoints (pages & API routes) | Use App Router layout conventions. No direct UI state computations in route files; delegate logic to helper hooks or components. |
| **`components/`** | Core UI component library | Group by feature domain (e.g. `ProjectOS.tsx`, `CareerRoadmapNavigator.tsx`). Keep components modular and readable. |
| **`lib/`** | Integrations, services, database models, and presets | Contains database adapters (`lib/db/`), fallback presets, and core business libraries (RAG, rate limiting, and oauth adapters). |
| **`hooks/`** | Custom React lifecycle hooks | Stateful UI hooks (e.g. token meters, window dimension listeners). Keep them stateless regarding global database calls. |
| **`services/`** | External API gateways communication | Handles integrations such as LinkedIn validate hooks, WhatsApp messaging queues, and Gmail synchronization loops. |
| **`utils/`** | Reusable, stateless utility helpers | String parsing, Date formatting, HSL color resolution logic, and mathematical averages utilities. |
| **`types/`** | Shared TypeScript definitions & schemas | Shared interfaces (e.g. `PlacementMissions`, `ProfileData`). Avoid file-local duplicate interface declarations. |
| **`supabase/`** | DB migration scripts & schema exports | All table declarations, triggers, indexes, and RLS definitions must reside here before manual production execution. |
| **`public/`** | Static assets, media, and images | Standard branding logos and static SVG vectors. Minimize file sizes. |
| **`docs/`** | Repository documentation center | Single source of truth for guidelines and specs. |

---

## 2. Component Layering Design

We divide UI rendering components into three distinct layers:

```
┌────────────────────────────────────────────────────────┐
│                      Layout Layer                      │
│             (app/layout.tsx, app/page.tsx)             │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Feature Panels                     │
│    (ProjectOS.tsx, CareerRoadmapNavigator.tsx, CRM)   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Shared Components                    │
│           (Dialogs, Gauges, Skeletons, Svg)            │
└────────────────────────────────────────────────────────┘
```

1.  **Layout & Routing Layer (`app/`)**: Handles Next.js route resolution, initial auth checks, and global provider distributions (e.g. Theme, Supabase Context).
2.  **Stateful Feature Panels (`components/`)**: Cohesive modules containing state controllers, user interactions, local inputs, and AI response handlers (e.g., `ProjectOS.tsx` handles tabs for mock rounds, insights, blueprints).
3.  **Atomic Shared Elements (`components/ui/`)**: Reusable widgets (buttons, badges, inputs, skeletons) styling components with design system class utilities. Must be completely stateless concerning network calls.

---

## 3. State Management Paradigms

BuggedBrain utilizes a hybrid state mechanism combining local caches, database synchronization, and caching proxies:

### 1. Supabase Async Persistence
- Primary source of truth for user profile states, completed placement missions, mock interview ratings, and CRM records.
- Accessible via helper models inside `lib/db/`.
- Authenticated calls dynamically map `auth.uid() = user_id` inside table policies.

### 2. LocalStorage Caches (Offline Support & Guests)
- Guest mode saves progress state indicators (`roadmap_progress_states`, `ats_score`, `interview_history`) inside local storage.
- Auto-sync checks these caches during auth state transitions to prevent data loss.

### 3. Upstash Redis Caching Proxy
- Caches high-latency AI requests (e.g. ATS analysis prompt outputs) under unique SHA-256 hash keys.
- Cache settings are loaded via `lib/redis.ts`, with a default TTL configuration of 24 hours.

### 4. Telemetry Telecommunications
- Real-time logging of latency and token consumption metrics is run in the background after AI query resolutions, avoiding request blockages.

---

## 4. Evaluation & Sandbox Compiler Architecture

To ensure speed, accuracy, and security, BuggedBrain decouples student evaluations and compiler executions into server-side and WebAssembly sandbox layers:

### 1. Centralized Evaluation Engine (`lib/services/`)
*   **Scoring Engine (`scoringEngine.ts`)**: Evaluates tests deterministically using strict mathematical criteria. MCQ answers are validated against options; SQL queries are validated against exact tabular results match; Coding problems are evaluated against test case pass ratios.
*   **Adaptive Difficulty Engine (`scoringEngine.ts`)**: Recommends focused syllabus pathways based on a student's difficulty accuracies (Easy, Medium, Hard) and rolling time limits performance.
*   **Analytics Intelligence (`analyticsIntelligence.ts`)**: Recalculates category/topic metrics, consistency days, and compiles weak topics warnings (topics with accuracy < 50% across $\ge 3$ attempts) in real time.
*   **Result Intelligence (`resultIntelligence.ts`)**: Calculates time efficiency speeds, difficulty accuracies, next actionable recommendations, and peer percentiles (only when distinct completions for a template $\ge 10$).

### 2. Secure Code & Query Compilation Sandbox (`lib/compiler/`)
*   **SQLite WASM Sandbox (`SqlSandbox.ts`)**: Utilizes `sql.js` in-memory SQLite compiled in WebAssembly. Seeds schemas on the fly and executes user query comparisons securely without database write access.
*   **Execution Sandbox (`ExecutionProvider.ts`)**: Connects to remote Judge0 API instances to execute code (supporting python, javascript, etc.) against hidden test cases. Falls back gracefully to local JS simulated runner environments on connection drops.
*   **Session State Isolation**: All compiler execution, attempt starts, and score updates validate `user_id` context via Supabase `auth.getUser()`, completely blocking IDOR parameter-tampering hacks.
