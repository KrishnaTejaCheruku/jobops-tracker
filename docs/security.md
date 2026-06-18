# Security Guide

This guide documents controls verified in the current repository.

## Authentication

- Passwordless OTP login is implemented by `POST /auth/request-otp` and `POST /auth/verify-otp`.
- Email addresses are parsed and normalized with Go's `net/mail`.
- OTP hashes are stored in PostgreSQL.
- OTP requests are limited per user email over a 15-minute window.
- OTP verification has a maximum attempt count.
- Development mode can return `debug_otp`; production mode should use SMTP and not expose debug OTPs.

## Sessions

- Successful OTP verification creates a random session token.
- The backend stores a session-token hash.
- The browser receives an HttpOnly cookie.
- `AUTH_COOKIE_SECURE=true` enables secure cookies for HTTPS production.
- Cookies use `SameSite=Lax`.
- Logout deletes the server-side session and clears the cookie.

## Authorization And User Ownership

Protected APIs use session middleware and set the authenticated user ID on the request context.

User-scoped data:

- Applications.
- CV versions.
- Dashboard analytics.
- CSV import/export.
- Status history through application ownership.

## Input Validation

Application validation covers:

- Required job title and company.
- Allowed source, work mode, status, and priority values.
- URL syntax and `http`/`https` scheme.
- Recruiter email syntax.
- Follow-up date format.
- Applied date format and no future applied date.

CSV import uses the same application validation before writing rows.

## Capture And OCR

The capture analyze endpoint:

- Can be disabled with `CAPTURE_ANALYZE_ENABLED`.
- Requires `application/json`.
- Uses `http.MaxBytesReader` with `CAPTURE_MAX_BYTES`.
- Forwards the request to the OCR service.
- Returns normalized fields to the frontend.
- Does not write applications to the database.

The frontend requires user review before saving captured fields.

The current OCR service reads request data in memory and returns extracted fields. The repository code does not persist screenshots to disk or database.

## Email Header Safety

SMTP OTP delivery validates recipient addresses and sanitizes message headers. Regression tests cover CRLF/header injection cases.

## HTTPS And Caddy

Production Compose includes Caddy. The active Caddyfile:

- Reverse proxies `/api/*` to the backend.
- Reverse proxies other requests to the frontend.
- Adds HSTS headers.
- Returns `404` for common sensitive probe paths such as `/.env`, `/.git*`, `/backup*`, `/phpmyadmin*`, and WordPress scanner paths.

## CI And Security Review

CI runs Go formatting/tests, frontend build and Cypress, browser-extension tests/validation/package build, Docker image builds, and Helm lint/template. Recent CodeQL findings are covered by focused regression tests in backend and OCR parsing code.

Use GitHub repository security features such as Dependabot alerts, secret scanning, push protection, and CodeQL/default code scanning where available.

## Responsible Disclosure

See [../SECURITY.md](../SECURITY.md).
