# Release & Versioning Strategy

This document outlines the product versioning rules, Git release candidate merges, tagging conventions, and database rollback procedures.

---

## 1. Semantic Versioning Standards

BuggedBrain releases follow the standard **Semantic Versioning (SemVer)** conventions (`vMAJOR.MINOR.PATCH`):

-   **MAJOR (`X.0.0`)**: Backwards-incompatible changes (e.g. database schema overhauls affecting multiple modules, replacing the primary authentication provider).
-   **MINOR (`0.Y.0`)**: Backwards-compatible feature additions (e.g. adding a new Assessment Sandbox, expanding Project Advisor mock rounds levels).
-   **PATCH (`0.0.Z`)**: Backwards-compatible bug fixes and optimizations (e.g. resolving memory leaks, updating typography files, fixing undefined key errors).

---

## 2. Release Candidate & Tagging Conventions

-   **Branch naming**: Release candidates use the naming structure `release/vX.Y.Z`.
-   **Merge Approval**: Release candidates require approval from the lead release maintainer.
-   **Git Tags**: Upon successful deployment to production, the merge commit must be tagged with the version:
    ```bash
    git tag -a v1.2.0 -m "Release version 1.2.0: Upgrade Mock Interviews Engine"
    git push origin v1.2.0
    ```

---

## 3. Deployment Rollback Strategy

If a deployment fails or triggers critical issues in production, developers must follow the emergency rollback strategy:

### 1. Vercel Rollback
-   Go to the Vercel project dashboard.
-   Select the **Deployments** tab.
-   Locate the previous stable deployment card.
-   Click the options menu (three dots) and select **Redeploy**.
-   This rolls back client routing and serverless logic within **30 seconds** without modifying the Git history.

### 2. Supabase DB Schema Reversion
-   If a database migration broke tables, do not write direct manual modifications.
-   Execute the corresponding rollback SQL script or restore the database from the daily backup copy (located in the Supabase backups panel).
-   *Important*: Notify the engineering team on Slack/Discord before restoring DB snapshots.
