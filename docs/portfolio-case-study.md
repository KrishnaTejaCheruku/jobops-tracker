# Portfolio Case Study

JobOps Tracker is a product-style portfolio application that combines full-stack product work with practical DevOps operations.

## Problem

Spreadsheet-based job tracking becomes hard to maintain when applications, follow-ups, CV versions, recruiter details, status changes, and outcomes accumulate.

## Implemented Product Scope

- Passwordless OTP authentication.
- User-scoped application and CV data.
- Application CRUD with validation.
- Status history.
- Follow-up tracking.
- CV version tracking.
- Dashboard analytics.
- CSV import/export with duplicate handling.
- Light/dark theme support.
- Browser extension and OCR-assisted capture with review before save.

## Architecture

The application is split into:

- React/Vite frontend.
- Go/Gin backend API.
- PostgreSQL database.
- Python/FastAPI OCR service.
- Manifest V3 browser extension.
- Caddy reverse proxy.
- Docker Compose production runtime.

Optional deployment assets include raw Kubernetes manifests, a Helm chart, Ansible playbooks, and OpenTofu Hetzner scaffolding.

## Delivery Flow

1. Changes land through pull requests into protected `main`.
2. GitHub Actions runs CI.
3. `v*` tags publish backend and frontend images to GHCR.
4. The VPS deploy pulls pinned backend/frontend images or builds from source.
5. Production is verified with HTTPS checks, API health checks, and OTP login smoke tests.

## Operations

Operational support includes:

- Database migrations.
- Backup and restore scripts.
- Dry-run maintenance for expired OTPs, expired sessions, and backup retention.
- Prometheus-compatible `/metrics`.
- Optional local Prometheus/Grafana monitoring stack.
- Production release and rollback runbooks.

## Security Practices

- Passwordless OTP authentication.
- User-owned data model.
- Secure auth cookie support for HTTPS production.
- Configurable CORS allowlist.
- OTP request throttling with `Retry-After`.
- SMTP email header safety tests.
- No production secrets in Git.
- Immutable backend/frontend image tag deployment instead of `latest`.
- Review-before-save capture workflow.

## Current Live Surface

Live domains:

```text
https://jobops.me
https://www.jobops.me
```

The repository documents production Compose and Caddy deployment for those domains. Always verify the current VPS environment before claiming a specific deployed image tag.

## Next Improvements

- Add an OCR image publishing workflow if pinned OCR images are required.
- Add production monitoring screenshots.
- Add Alertmanager wiring if external alert delivery is needed.
- Add CV file upload and reminder notifications.
