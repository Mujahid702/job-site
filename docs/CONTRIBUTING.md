# Developer Contributing & Workflows Guide

This document describes Git branching standards, pull request flows, task managers pipelines, and testing procedures.

---

## 1. Repository Branching Strategy

BuggedBrain enforces a strict branching strategy. **Direct commits to `main` and `dev` are strictly prohibited.**

```
main   (Production stable code only. Merged from release/*)
 ▲
 │  [Pull Request & Automated Tests]
 │
dev    (Integration branch for feature testing. Merged from feature/* & bugfix/*)
 ▲
 ├── feature/resume-os  ──> (Feature branches must match feature/[module-name])
 ├── feature/copilot
 ├── bugfix/ats-crashes ──> (Bugfix branches must match bugfix/[bug-description])
 └── hotfix/key-leak    ──> (Hotfixes branch from main to bypass standard dev timelines)
```

### Branch Nomenclature Rules:
-   **New Features**: `feature/[short-module-desc]` (e.g. `feature/resume-os`, `feature/assessment-os`, `feature/community-hub`).
-   **Bug Fixes**: `bugfix/[issue-number]-[short-desc]` (e.g. `bugfix/401-login-redirect`).
-   **Emergency Patches**: `hotfix/[short-desc]` (only branch from `main`).
-   **Releases Candidates**: `release/v[major].[minor].[patch]`.

---

## 2. Pull Request Merge Process

1.  **Branching**: Create a branch off `dev`:
    ```bash
    git checkout -b feature/recruiter-crm dev
    ```
2.  **Coding**: Implement changes following the [Coding Guidelines](file:///docs/CODING_GUIDELINES.md).
3.  **Local Checks**: Run local verification:
    ```bash
    npx tsc --noEmit
    npm run build
    ```
4.  **Push**: Push to remote repository and open a Pull Request (PR) targeting the `dev` branch.
5.  **Review Loop**: At least **one peer review approval** is required to merge into `dev`.
6.  **Staging Test**: Merge PR into `dev`. The QA team triggers automated assessment suites.
7.  **Production Release**: When stable, a release candidate branch (`release/*`) merges `dev` into `main`.

---

## 3. GitHub Projects Task Board

All development tasks must map to cards inside our GitHub Projects board across these status columns:

1.  **Backlog**: Raw requirements, user stories, and features under scoping.
2.  **Ready**: Approved tasks containing detailed technical specs, owners, and dependencies.
3.  **In Progress**: Actively owned cards. No developer should own more than 2 in-progress cards.
4.  **Testing**: Verification step. Code is on staging, awaiting automated checks/manual validations.
5.  **Review**: Awaiting peer review code inspections.
6.  **Blocked**: Interrupted tasks. Must attach a blocking comment specifying the dependency.
7.  **Done**: Successfully merged into `main` and verified in production.

### Task Specifications format:
-   **Title**: Clear summary.
-   **Owner**: Assigned developer.
-   **Priority**: High / Medium / Low.
-   **Dependencies**: Reference blockers.
-   **Acceptance Criteria**: List functional requirements.

---

## 4. Code Review Guidelines

Reviewers must inspect and assert the following rules before approving:

-   **Type Safety**: No fallback use of the `any` keyword. No manual overrides of compiler rules.
-   **Performance**: Ensure SQL queries use index lookups, and AI queries utilize Upstash caches.
-   **Security**: Verify that RLS is active on tables and input validation is done on APIs.
-   **Layout**: Ensure Tailwind classes follow modern HSL styling conventions with no hardcoded pixel constraints.
-   **File length**: React components should not exceed 800 lines of code. Split complex UI panels.
