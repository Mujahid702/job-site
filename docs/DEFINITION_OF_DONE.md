# Definition of Done (DoD) Checklist

A user story or feature card is not considered "Done" and cannot be merged into the `main` production branch unless it satisfies every criterion in this checklist.

---

## 1. Feature Specifications & UI Quality
- [ ] **Functional requirements met**: The implemented feature behaves exactly as described in the issue acceptance criteria.
- [ ] **Responsive Design**: UI layouts are tested across Mobile, Tablet, and Desktop screen widths. Uses Tailwind fluid classes with no hardcoded width blockages.
- [ ] **State Handling**: Explicit skeletons render during loading, clean empty states render when tables are blank, and clear error pages prompt users on network timeouts.
- [ ] **Accessibility (a11y)**: Focus rings are visible for keyboard navigation, interactive widgets use semantic tags, and images include descriptive alt parameters.

---

## 2. Engineering & Safety Quality
- [ ] **TypeScript Check**: The command `npx tsc --noEmit` runs with zero compilation warnings or errors.
- [ ] **Lint Clean**: Running `npm run lint` yields zero ESLint formatting violations.
- [ ] **Database safety**: Queries utilize indexed columns and parameterized arguments. Row Level Security is verified to block cross-user leakages.
- [ ] **AI Safety**: Prompts enforce JSON schema validation, catch API connection errors, and fall back to presets templates when rate limits occur.

---

## 3. Documentation & Governance
- [ ] **Folder Alignment**: Files reside in correct system directories according to the [Architecture Guide](file:///docs/ARCHITECTURE.md).
- [ ] **API Registry**: Endpoints created/modified are documented in [API Reference](file:///docs/API.md) with parameters, latency, caching, and owner metadata.
- [ ] **DB Catalog updated**: Columns added/removed are logged in [Database Catalog](file:///docs/DATABASE.md).
- [ ] **Changelog Updated**: Releases versions are recorded inside the project [Changelog](file:///docs/CHANGELOG.md).

---

## 4. Pull Request & Deployment Release
- [ ] **Branch isolation**: Feature branch branched off `dev` and matches naming conventions (`feature/*` / `bugfix/*`).
- [ ] **PR template populated**: All fields in `.github/pull_request_template.md` are completed.
- [ ] **Code review approval**: At least one peer review approval is obtained.
- [ ] **Local Testing Passed**: Production builds (`npm run build`) succeed with prebuild environment verification checks passing cleanly.
