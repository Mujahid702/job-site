---
name: Security
about: Report vulnerabilities, RLS bypasses, leakage of secret credentials, or audit problems.
title: "[SECURITY]: "
labels: security
assignees: ''
---

### Vulnerability Details
Provide a clear description of the security issue. (If reporting a sensitive vulnerability, follow the private vulnerability reporting channels where possible).

### Vulnerable Component / API Path
- Endpoint or file:
- Database table or RLS policy:

### Threat Assessment
- **Severity**: Low / Medium / High / Critical
- **Potential Impact**: e.g. Data leakage of user resumes, unauthorized admin modifications, API key exposure.
- **Assigned Security Lead**:

### Steps to Reproduce (or PoC)
Outline how to verify the vulnerability.

### Proposed Remediations
Outline fix steps.
- [ ] RLS Policy rewrite
- [ ] Server-side input validation
- [ ] Rotation of secrets
