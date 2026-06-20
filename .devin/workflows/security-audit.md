---
description: Run a comprehensive security audit on the codebase. Detects vulnerabilities, hardcoded secrets, insecure dependencies, and misconfigurations.
---

Use the @security-audit skill to perform a deep security scan of the project.

## Usage

- `/security-audit` — Run a full audit on the entire codebase.
- `/security-audit src/app/api` — Audit a specific directory or module.
- `/security-audit --format sarif` — Output findings in SARIF format (if supported).

## What it checks

- Dependency CVEs (`npm audit`)
- Hardcoded secrets and tokens
- SQL / command / path traversal injection
- XSS and unsafe HTML output
- Authentication and session flaws
- Missing security headers and CORS misconfigurations
- Dangerous coding patterns (`eval`, `dangerouslySetInnerHTML`, etc.)
- Input validation gaps

## Output

A structured report with severity ratings, file/line references, evidence snippets, and concrete remediation steps.
