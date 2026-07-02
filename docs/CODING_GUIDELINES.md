# Engineering Coding Guidelines

This document establishes the coding standards, TypeScript checks, and safety rules for developers.

---

## 1. Core TypeScript Rules

-   **Strict Type Safety**: The compiler configuration is set to strict. Do not bypass type validations.
-   **No `any` Keyword**: Use explicit type declarations, generics, or custom interface mappings. Use `unknown` with narrowing checks if type is dynamic.
-   **Nullable Types**: Avoid using non-null assertions `!`. Use optional chaining `?.` or explicit null-guard validations.

---

## 2. Naming Conventions

### Files & Folders
-   **React Components**: PascalCase (e.g. `ProjectOS.tsx`, `SuccessTrackerOS.tsx`).
-   **Hooks**: camelCase starting with `use` (e.g. `useTokenMeter.ts`).
-   **API Route Files**: Always named `route.ts` inside nested folder paths (e.g. `app/api/resume/roadmap/route.ts`).
-   **Folder Names**: lowercase kebab-case (e.g. `company-prep`, `placement-readiness`).

### Variables & Functions
-   **Variables & Functions**: camelCase (e.g. `toggleCheckItem`, `workspaceStats`).
-   **Constants**: UPPER_SNAKE_CASE (e.g. `DEFAULT_ROADMAP_DATA`, `CACHEABLE_TASKS`).
-   **Interfaces & Types**: PascalCase (e.g. `RoadmapStage`, `TrackPreset`).

---

## 3. Code Cleanliness & Constraints

-   **Maximum File Length**: File size should not exceed **800 lines**. If a React component or utility surpasses this limit, refactor features into sub-components (e.g., extracting tabs into separate helper files).
-   **Avoid Duplicate Logic**: Centralize parsing algorithms, scoring math, or database fetch calls in `lib/` helpers rather than duplicate coding.
-   **Reusable Hooks**: Custom state handles (e.g., token usage calculations, sizing listeners) belong in the root `hooks/` directory.

---

## 4. API & Database Security Standards

-   **Input Validations**: Validate API parameters server-side using **Zod** models before launching business logic:
    ```typescript
    const requestSchema = z.object({
      targetRole: z.string().min(2),
      atsScore: z.number().min(0).max(100)
    });
    ```
-   **Admin Endpoints protection**: Protect all administrative APIs in `/api/admin/*` by checking `is_admin()` function helper during session validation.
-   **No Raw SQL string concatenations**: Utilize parameterized Supabase RPC calls to prevent SQL injections.

---

## 5. AI Prompting Standards

-   **Strict Schema enforcement**: Always instruct the AI provider models to return structured JSON mapping schemas.
-   **Fallback handling**: Always catch failures and return compatible fallback structures (e.g. mapping templates when Gemini rates are exceeded).
-   **Token Optimization**: Keep system context concise. Do not inject full document histories unless required.
-   **Cost Telemetry logging**: Register usage cost, timings, and token metrics inside the cost tracker.
