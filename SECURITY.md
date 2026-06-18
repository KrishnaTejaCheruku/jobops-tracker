# Security Policy

## Supported Branch

Security fixes should target `main` through a pull request. Do not push directly to protected `main`.

## Reporting A Vulnerability

If you find a vulnerability, do not open a public issue with exploit details.

Report privately to the repository owner through GitHub or another agreed private channel. Include:

- Affected component or route.
- Reproduction steps.
- Expected impact.
- Suggested fix, if known.

Do not include production secrets, private keys, database dumps, SMTP credentials, OTP values from real users, or session tokens in the report.

## Current Security Controls

Verified controls are documented in [docs/security.md](docs/security.md). The project currently includes passwordless OTP authentication, HttpOnly session cookies, secure-cookie production support, user-scoped data access, input validation, protected application/CV/dashboard/CSV APIs, size-limited capture analysis, review-before-save OCR capture, Caddy HTTPS support, and CI checks.

## Security Changes

Security-sensitive changes should include focused tests and documentation updates. Recent CodeQL-driven remediations are covered by regression tests in the backend and OCR parsing code.
