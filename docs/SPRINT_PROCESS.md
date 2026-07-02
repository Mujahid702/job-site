# Engineering Sprint Process & Rhythm

This document establishes the sprint process, weekly cadence, task assignment guidelines, and release schedules.

---

## 1. Weekly Rhythm Cadence

To coordinate parallel developers, BuggedBrain follows a structured weekly sprint lifecycle:

| Day | Active Phase | Phase Tasks & Meetings |
| :--- | :--- | :--- |
| **Monday** | **Sprint Planning** | Refine backlog, assign owner to tasks, set priority levels, and draft ETA bounds. |
| **Tuesday - Friday** | **Active Development** | Feature coding in feature branches. Daily standups logs review. Local compiler checks. |
| **Saturday** | **Staging QA & Testing** | Merge feature branches into `dev` branch. Conduct system assessments verification and edge validations. |
| **Sunday** | **Production Release** | Compile release candidate (`release/*`), run build checklists, merge to `main`, and deploy to production. |

---

## 2. Sprint Workflow Pipeline

```
[Monday: Planning] ──> [Tue-Fri: Branch & Code] ──> [Sat: QA & Merge Dev] ──> [Sun: Release Main]
```

### 1. Sprint Planning & Scoping (Monday)
- Maintainers review the Backlog column.
- Estimate tasks complexity and define exact **Acceptance Criteria**.
- Check database table dependencies to avoid locking conflicts.

### 2. Active Development (Tuesday - Friday)
- Developers work on branches isolated from `main`.
- Write convention-compliant commits (e.g. `feat(copilot): write chats handler`).
- Maintain component size checks (refactor if files approach 800 lines).

### 3. QA Testing & Review Loop (Saturday)
- Submit Pull Request to `dev`.
- Peer reviews inspect code for security gaps and query optimizations.
- Fix visual hydration or mobile responsiveness gaps.

### 4. Release Deployments (Sunday)
- Merge approved `dev` branches to release branches.
- Execute validation tests. Deploy code to cloud hosting and monitor errors dashboard.
