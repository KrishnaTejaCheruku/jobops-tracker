# JobOps Tracker Portfolio Case Study

JobOps Tracker is a self-hosted job application tracker built to demonstrate full-stack product engineering and practical DevOps operations.

## Problem

Manual spreadsheet-based job tracking becomes difficult to maintain as applications, follow-ups, CV versions, recruiters, and status changes accumulate.

JobOps Tracker replaces that spreadsheet workflow with a private web application that supports structured tracking, analytics, import/export, and user-scoped data.

## Product Scope

Implemented product capabilities:

- Passwordless OTP authentication
- Private user-scoped job application data
- Application CRUD with validation
- Status history
- Follow-up tracking
- CV version tracking
- Analytics dashboard
- CSV import/export with duplicate handling
- Light/dark theme support

## Architecture

The application is split into:

- React/Vite frontend
- Go/Gin backend API
- PostgreSQL database
- Caddy reverse proxy
- Docker Compose production runtime

Production runs on a Hetzner VPS behind Caddy with HTTPS, HTTP-to-HTTPS redirects, HSTS, and sensitive probe-path hardening.

## Delivery Flow

The delivery flow is designed to look like a small production system:

1. Changes land through pull requests into protected `main`.
2. GitHub Actions runs CI.
3. Version tags such as `v0.6.0` trigger container image publishing.
4. Backend and frontend images are pushed to GHCR.
5. The VPS deploy pulls explicit pinned image tags.
6. Production is verified with HTTPS checks, API health checks, and OTP login smoke tests.

Current production images:

```text
ghcr.io/krishnatejacheruku/jobops-tracker-backend:v0.6.0
ghcr.io/krishnatejacheruku/jobops-tracker-frontend:v0.6.0
```

## Operations

Operational support includes:

- Database migrations
- Production backup and restore scripts
- Dry-run maintenance for expired OTPs, expired sessions, and backup retention
- Prometheus-compatible `/metrics`
- Optional local Prometheus/Grafana monitoring stack
- Production release and rollback runbook

Rollback for normal releases is image-tag based: update `BACKEND_IMAGE` and `FRONTEND_IMAGE` to the previous known-good GHCR tag and rerun the deploy script.

## Security Practices

Security-focused decisions:

- Passwordless OTP authentication
- User-owned data model
- Secure auth cookie support for HTTPS production
- Configurable CORS allowlist
- OTP request throttling with `Retry-After`
- No production secrets in Git
- GitHub branch protection
- Dependabot/security alerts
- Read-only deploy key guidance for VPS repository access
- Immutable image tag deployment instead of `latest`

## Current Production State

Live domains:

```text
https://jobops.me
https://www.jobops.me
```

Verified production behavior:

```text
HTTPS frontend returns 200
API health returns database ok
HSTS header is present
OTP browser smoke test passed
Production runs pinned v0.6.0 GHCR images
```

## Next Improvements

- Add production monitoring screenshots.
- Add Alertmanager wiring if external alert delivery is needed.
- Add public screenshots and architecture diagrams.
- Add CV file upload and follow-up reminders.
