# Local Development Rules & Git Commit Hygiene

This document defines Git discipline rules, commit formatting structures, and review requirements to support friction-free collaboration.

---

## 1. Branch Isolation Rules

-   **Never commit directly to `main` or `dev`**: Any direct pushes will be rejected by repository protection rules.
-   **Always branch off `dev`**: Create feature branches off the latest integration state:
    ```bash
    git checkout dev
    git pull origin dev
    git checkout -b feature/my-new-widget
    ```
-   **One Task, One Branch**: Keep branches focused. Do not mix unrelated refactorings or fixes inside the same branch.

---

## 2. Atomic Commits & Conventional Formatting

Commits should be atomic (changing one concept/module at a time) and must follow Conventional Commits formatting:

### Format:
```
<type>(<scope>): <short description>
```

### Types:
-   **`feat`**: A new feature (e.g. `feat(project-os): add 5-level progressive mock panel`).
-   **`fix`**: A bug fix (e.g. `fix(ats-evaluator): resolve key undefined length crash`).
-   **`docs`**: Documentation updates (e.g. `docs(getting-started): expand debugging section`).
-   **`style`**: Formatting adjustments (no logic changes).
-   **`refactor`**: Code restructuring with no functional changes.
-   **`test`**: Adding missing tests.

---

## 3. Local Verification Before Pushing

Before pushing changes to GitHub, developers must execute verification script steps:

1.  **Run environment validation checks**:
    ```bash
    node scripts/verify-env.js
    ```
2.  **Verify type integrity**:
    ```bash
    npx tsc --noEmit
    ```
3.  **Validate build compilation**:
    ```bash
    npm run build
    ```

---

## 4. Documentation & PR Guidelines

-   **Keep Documentation in Sync**: If you modify database tables, APIs, or component props, you must immediately update files in `/docs`.
-   **Focused Pull Requests**: A PR should only cover the scope of the corresponding issue card.
-   **Include Verification Logs**: Paste compiler outputs (`npx tsc`) and browser console checks inside your PR description.
