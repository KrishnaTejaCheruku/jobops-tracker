# JobOps Tracker — Codex Project State and Next Steps

## Purpose

This document is the working handoff file for Codex.

The goal is to keep Codex aligned with the current state of `jobops-tracker`, prevent repeated context loss, and clearly define what has already been completed, what is currently pending, and what should be implemented next.

Codex should read this file before making further changes.

---

## Repository

```bash
~/Desktop/jobops-tracker
```

Project name:

```text
jobops-tracker
```

GitHub repository:

```text
KrishnaTejaCheruku/jobops-tracker
```

---

## Project Summary

`jobops-tracker` is an open-source, portfolio-grade job application tracker.

It helps track:

* Job applications
* Application statuses
* CV versions
* Follow-up dates
* Recruiters
* Job descriptions
* Notes
* Analytics
* CSV import/export
* Multi-user private application data

The project is intended to demonstrate:

* Full-stack product engineering
* Backend API design
* PostgreSQL data modeling
* Authentication and user isolation
* Frontend UX
* Testing
* Docker-based deployment
* Kubernetes and Helm packaging
* CI/CD
* Ansible automation
* VPS operations
* Infrastructure-as-code scaffolding

---

## Tech Stack

### Backend

* Go
* Gin
* PostgreSQL
* pgx / pgxpool
* Cookie-based passwordless OTP authentication

### Frontend

* React
* Vite
* Plain CSS / component CSS
* Cypress e2e tests

### Database

* PostgreSQL

### Local Development

* Docker Compose

### Production / VPS

* Docker Compose
* Caddy reverse proxy
* Hetzner VPS

### Kubernetes

* Raw Kubernetes manifests
* Helm chart
* Local kind cluster validation

### CI/CD

* GitHub Actions
* GHCR image publishing
* Manual VPS deployment workflow

### Automation / IaC

* Ansible VPS bootstrap/deploy automation
* OpenTofu Hetzner scaffold

---

## Critical Working Rules for Codex

Codex must follow these rules:

1. Do not rewrite the whole project unnecessarily.
2. Do not remove existing features.
3. Do not rename files unless absolutely necessary.
4. Do not introduce a heavy auth framework.
5. Keep the UI simple, clean, aesthetic, and maintainable.
6. Keep changes small, readable, and production-minded.
7. Use existing project patterns.
8. Never commit secrets.
9. Never commit:

   * `.env`
   * `.env.production`
   * `.env.production.local`
   * SSH private keys
   * API tokens
   * Hetzner tokens
   * GitHub tokens
   * `terraform.tfvars`
10. Do not deploy to VPS unless explicitly instructed.
11. Do not run destructive Docker/Postgres commands against production.
12. Do not run `tofu apply`.
13. Do not import the current live VPS into OpenTofu state.
14. Current live Hetzner VPS remains manual.
15. OpenTofu is portfolio IaC / future rebuild path only.
16. Backend and frontend auth changes must be deployed together.
17. Never deploy auth backend alone while the frontend cannot handle protected routes.
18. Stop after completing the requested phase and report changed files and test results.

---

## Current Git State to Check First

Before making any change, Codex should run:

```bash
git status --short
git log --oneline -10
```

Observed recent Codex state from the terminal:

```text
Latest observed commit:
87d0a89 test: expand auth e2e coverage and dev seed
```

Observed previous summary:

```text
Cypress: 9 passing, 0 failing
Frontend build: passed
Backend Go tests: passed
Seed safety check without confirmation: refused as intended
Dev/test seed with confirmation: passed
Repository clean and synced with origin/main
```

Expected recent commits may include:

```text
87d0a89 test: expand auth e2e coverage and dev seed
e2f3...  ci: run Cypress e2e tests
3cb...   test: silence Cypress warnings
75d...   fix: port config
```

Codex must verify actual current state before making changes.

---

## Completed Product Features

The app currently supports:

1. Applications CRUD
2. Extended application fields
3. Backend validation
4. Frontend validation display
5. Filters
6. Sorting
7. Pagination
8. Status history
9. Follow-up dashboard
10. CV versions
11. Analytics dashboard
12. CSV import
13. CSV export
14. CSV duplicate detection / update / skip behavior
15. Light/dark theme toggle
16. Application detail modal
17. Passwordless OTP login
18. Auth-gated dashboard
19. User-scoped data isolation

---

## Completed Backend Features

The backend includes:

* REST API with Gin
* PostgreSQL connection handling
* Applications repository
* CV versions repository
* Dashboard analytics repository
* CSV import/export handling
* Validation layer
* OTP authentication
* User sessions
* User-scoped query isolation

Important backend paths:

```text
apps/backend/cmd/api/main.go
apps/backend/internal/handlers/
apps/backend/internal/repository/
apps/backend/internal/models/
apps/backend/internal/services/
apps/backend/internal/middleware/
apps/backend/internal/validation/
apps/backend/migrations/
```

---

## Completed Frontend Features

The frontend includes:

* React/Vite app
* Dashboard shell
* Summary cards
* Analytics dashboard
* Application form
* Applications table
* Filters
* Pagination controls
* Sorting controls
* CV versions panel
* CSV import/export panel
* Follow-up dashboard
* Application detail modal
* Status history modal
* Theme toggle
* Auth gate/login page

Important frontend paths:

```text
apps/frontend/src/App.jsx
apps/frontend/src/components/
apps/frontend/src/lib/api.js
apps/frontend/src/lib/authApi.js
apps/frontend/src/lib/constants.js
apps/frontend/src/styles.css
```

---

## Completed DevOps / Platform Work

The project already includes:

1. Docker Compose local development
2. Production Docker Compose
3. Caddy reverse proxy
4. Caddy probe-path 404 handling for common sensitive/scanner URLs
5. VPS-ready deployment scripts
6. Production backup script
7. Production restore script
8. Daily backup cron helper
9. Production health check script
10. Production status script
11. Production monitor script
12. Docker log rotation
13. Caddy access logs
14. Raw Kubernetes manifests
15. Local 2-node kind Kubernetes cluster validation
16. Helm chart
17. GitHub Actions CI
18. GHCR image publishing
19. GitHub manual deploy workflow
20. Ansible VPS bootstrap/deploy automation
21. Hetzner VPS live deployment
22. OpenTofu Hetzner scaffold
23. Live `jobops.me` and `www.jobops.me` HTTPS domain setup
24. HTTP-to-HTTPS redirects
25. HSTS header for live HTTPS responses
26. Prometheus-compatible backend `/metrics` endpoint
27. Monitoring guide with scrape and alert examples
28. Dry-run production maintenance script for expired OTPs, expired sessions, and backup retention
29. Optional Prometheus/Grafana monitoring compose stack
30. Grafana dashboard JSON and datasource provisioning
31. Configurable `CORS_ALLOWED_ORIGINS`
32. `Retry-After` header for OTP request throttling
33. GitHub hardening and production release/deploy runbook

---

## Completed Authentication Work

Backend auth is implemented.

Routes:

```text
POST /auth/request-otp
POST /auth/verify-otp
GET  /auth/me
POST /auth/logout
```

Session behavior:

```text
Cookie name: jobops_session
HttpOnly: yes
SameSite: Lax
Secure: false locally
Secure: should become true after HTTPS/domain
```

Current local behavior:

```text
Development mode returns debug_otp
Production mode should not expose debug_otp
SMTP OTP delivery is available for production
OTP requests are limited to 5 per email per 15 minutes
OTP verification is limited to 5 attempts per code
```

Backend auth files include:

```text
apps/backend/internal/handlers/auth_handler.go
apps/backend/internal/repository/auth_repository.go
apps/backend/internal/services/otp_service.go
apps/backend/internal/middleware/auth_middleware.go
apps/backend/internal/models/auth.go
```

---

## Completed User Isolation Work

Backend user isolation is implemented.

Database objects:

```text
users
user_otps
user_sessions
applications.user_id
cv_versions.user_id
```

Protected routes:

```text
/applications
/cv-versions
/dashboard/analytics
```

Expected behavior:

```text
GET /applications without cookie -> 401 Unauthorized
GET /applications with valid cookie -> 200 OK
```

Existing old data was backfilled to:

```text
demo@jobops.local
```

Manual local auth behavior was tested:

```text
Login page appears
OTP request works
Dev OTP appears
OTP verify works
Dashboard loads after login
Logout returns to login page
Authenticated application route returns 200
Unauthenticated application route returns 401
```

---

## Completed Frontend Auth Work

Frontend auth files:

```text
apps/frontend/src/components/AuthGate.jsx
apps/frontend/src/components/AuthGate.css
apps/frontend/src/lib/authApi.js
```

App behavior:

```text
Dashboard hidden before login
Login page appears before session
OTP request works
Dev OTP appears locally
OTP verification works
Dashboard loads after login
Logout returns user to login page
```

Frontend API client:

```text
apps/frontend/src/lib/api.js
```

must send cookies with API requests:

```javascript
credentials: "include"
```

This is required for protected backend routes.

---

## Completed Cypress / Test Work

Codex added Cypress coverage.

Observed coverage includes:

```text
OTP login e2e
Auth gate e2e
Application create/list/delete e2e
Logout e2e
Unauthenticated protected-shell behavior e2e
CSV import/export auth behavior
Dashboard analytics after creating data
User isolation UI contract
```

Observed test result:

```text
9 passing
0 failing
```

Before changing Cypress tests, inspect:

```bash
find apps/frontend/cypress -type f | sort
cat apps/frontend/cypress.config.cjs
cat apps/frontend/package.json
```

---

## Completed Dev/Test Seed Work

Codex added guarded dev/test seed support.

Expected seed command:

```bash
make seed-dev-test CONFIRM_DEV_TEST_SEED=yes
```

Expected generated data:

```text
100 users
100 applications per user
10,000 total applications
```

Safety behavior:

```text
make seed-dev-test
```

should refuse to run without confirmation.

Additional SQL safety:

```text
SQL refuses unless PGOPTIONS='-c jobops.allow_dev_test_seed=on' is set by Makefile
```

Codex must not make this seed run automatically in production.

---

## Current Important Issue to Verify / Fix

The user noticed that the frontend allowed selecting a future `applied_date`.

Business rule:

```text
applied_date must default to today
applied_date must not be in the future
follow_up_date may be today or future
```

Preferred behavior:

```text
Frontend prevents future applied_date with max=today
Backend validation rejects future applied_date
CSV import rejects rows with future applied_date
Error message: applied_date cannot be in the future
```

Backend should not silently normalize future `applied_date` if field-level validation exists. It should reject invalid data clearly.

---

## Immediate Next Task for Codex

Task name:

```text
Switch production deployment design to pinned GHCR image tags
```

Context:

```text
GitHub remains the source of truth.
docs/production-release-runbook.md documents hardening, deploy keys, release, deploy, rollback, and future pinned-image deploys.
The current VPS deploy still pulls code and builds images locally with scripts/prod-deploy.sh.
The next hardening step is to change the deploy path so the VPS pulls explicit GHCR image tags instead of building from source.
```

Expected local-only implementation work:

1. Add environment-driven backend/frontend image references to `infra/docker/docker-compose.prod.yml`.
2. Add a pinned-image deploy mode or companion deploy script that pulls `ghcr.io/...:vX.Y.Z`.
3. Keep local source-build production deploy available until the pinned-image path is verified.
4. Update `docs/production-release-runbook.md` with the exact pinned-image deploy and rollback commands.
5. Add tests or shell validation where practical.
6. Do not deploy to production unless explicitly instructed by the user.

---

## Completed Production Auth Rollout

Production auth rollout documentation is maintained in:

```text
docs/auth-production-rollout.md
```

Current production state:

```text
Backend and frontend auth are deployed together
Required auth/user ownership migrations are applied
APP_ENV=production
AUTH_SECRET is required
AUTH_COOKIE_SECURE=true
OTP_DELIVERY_MODE=smtp
Production responses do not expose debug_otp
SMTP OTP delivery is configured
OTP request throttling is enabled
```

---

## Completed Engineering Phase: SMTP OTP Delivery

SMTP-based OTP delivery is implemented.

Design:

```text
OTPDelivery interface
LogOTPDelivery for local/dev
SMTPOTPDelivery for production
```

Environment variables:

```text
OTP_DELIVERY_MODE=log|smtp
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM
SMTP_FROM_NAME
```

Current rules:

```text
development -> log OTP and optionally return debug_otp
production + smtp -> send OTP by email
production + log -> allowed only if explicitly configured for internal demo, but warn in docs
APP_ENV=production should not return debug_otp
```

Tests:

```text
Request OTP local mode returns debug_otp
Production mode does not return debug_otp
SMTP delivery can be tested with mocked delivery interface
```

---

## Completed Engineering Phase: OTP Rate Limiting

Implemented after SMTP.

Rate limiting requirements:

```text
Limit OTP request per email
Limit OTP verify attempts
Existing max_attempts exists at OTP row level
Add request throttling by email/IP if lightweight
Do not add Redis yet unless necessary
PostgreSQL-based throttling is acceptable for this project
```

Suggested behavior:

```text
Max 5 OTP requests per email per 15 minutes
Max 5 verification attempts per OTP
Expired OTP invalid
Verified OTP invalid
New OTP invalidates old active OTPs
```

Current implementation:

```text
OTP request throttle uses existing user_otps rows
6th OTP request for the same user email within 15 minutes returns 429
Throttled OTP requests do not create or deliver a new OTP
```

---

## Completed Engineering Phase: Production Deploy

Production deployment is live on the Hetzner VPS and fronted by Caddy.

Current deployment checklist:

```text
Take a database backup
Pull the latest main branch
Run production deploy script
Run production health check
Run production monitor script when needed
```

Production deploy steps should include:

```bash
ssh root@94.130.75.66
cd /opt/jobops-tracker
./scripts/prod-backup.sh .env.production
git pull --ff-only
./scripts/prod-deploy.sh .env.production
./scripts/prod-healthcheck.sh
./scripts/prod-monitor.sh .env.production
```

Verify:

```bash
curl https://jobops.me/api/health
curl https://www.jobops.me/api/health
```

Browser verify:

```text
https://jobops.me
```

---

## Completed Engineering Phase: GitHub And Release Hardening

Current release strategy:

```text
GitHub remains the canonical source repository
GitHub Actions remains the CI and release image publisher
The VPS should use read-only repository access
Production deploys remain manual unless explicitly triggered
```

Runbook:

```text
docs/production-release-runbook.md
```

Documented controls:

```text
Branch protection on main
Required CI before merge
Minimal GitHub Actions permissions
Read-only deploy key for VPS repository checkout
Manual tagged release flow
Production backup, deploy, health check, and rollback flow
Future pinned GHCR image deployment plan
```

Next deployment hardening step:

```text
Switch production deploys from pulling latest code and building on the VPS to pulling explicit GHCR image tags.
```

Do not implement or run the production switch unless the user explicitly asks for it.

---

## Completed Engineering Phase: Domain + HTTPS

Current live domains:

```text
https://jobops.me
https://www.jobops.me
```

Current production environment shape:

```text
JOBOPS_SITE_ADDRESS=jobops.me, www.jobops.me
AUTH_COOKIE_SECURE=true
```

Current behavior:

```text
http://jobops.me redirects to https://jobops.me
http://www.jobops.me redirects to https://www.jobops.me
HTTPS responses include Strict-Transport-Security: max-age=31536000; includeSubDomains
API health passes on both apex and www hosts
```

Verify:

```bash
curl -I http://jobops.me
curl -I http://www.jobops.me
curl -I https://jobops.me
curl -I https://www.jobops.me
curl https://jobops.me/api/health
curl https://www.jobops.me/api/health
```

---

## Completed Engineering Phase: Monitoring And Observability

Completed:

```text
Backend exposes GET /metrics
Metrics are Prometheus text format
HTTP request counters and duration histograms are recorded
Database connectivity gauge is exposed
Application uptime gauge is exposed
docs/monitoring.md documents scrape and alert examples
infra/monitoring/prometheus/prometheus.yml provides scrape config
infra/monitoring/prometheus/alerts.yml provides alert examples
infra/monitoring/docker-compose.monitoring.yml runs optional Prometheus/Grafana stack
infra/monitoring/grafana/dashboards/jobops-overview.json provides dashboard JSON
```

Current metrics:

```text
jobops_app_uptime_seconds
jobops_database_up
jobops_http_requests_total
jobops_http_request_duration_seconds
```

Optional later work:

```text
Add Alertmanager wiring if external alert delivery is needed
Add production monitoring runbook screenshots after deployment
```

Suggested verification:

```bash
go -C apps/backend test ./...
curl http://localhost:8000/metrics
docker compose -f infra/docker/docker-compose.yml up -d --build backend
```

---

## Completed Engineering Phase: Maintenance Automation

Current maintenance support:

```text
scripts/prod-maintenance.sh
```

Behavior:

```text
Dry run by default
Requires CONFIRM_PROD_MAINTENANCE=yes before deleting anything
Deletes expired OTP rows after OTP_RETENTION_DAYS
Deletes expired session rows after SESSION_RETENTION_DAYS
Prunes old backup dump files after BACKUP_RETENTION_DAYS
Does not delete users, applications, CV versions, or current sessions
```

Usage:

```bash
./scripts/prod-maintenance.sh .env.production
CONFIRM_PROD_MAINTENANCE=yes ./scripts/prod-maintenance.sh .env.production
```

Documentation:

```text
docs/backup-restore.md
```

---

## Common Verification Commands

### Git

```bash
git status --short
git log --oneline -10
git diff --stat
```

### Backend

```bash
go -C apps/backend fmt ./...
go -C apps/backend test ./...
```

### Frontend

```bash
cd apps/frontend
npm run build
cd ../..
```

### Cypress

```bash
cd apps/frontend
npm run cy:run
cd ../..
```

### Local Compose

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build backend frontend
docker compose -f infra/docker/docker-compose.yml logs --tail=100 backend
docker compose -f infra/docker/docker-compose.yml ps
```

### Production Health

```bash
curl https://jobops.me/api/health
curl https://www.jobops.me/api/health
```

### Production SSH

```bash
ssh root@94.130.75.66
```

or with deploy key:

```bash
ssh -i ~/.ssh/jobops_vps_github_actions -o IdentitiesOnly=yes root@94.130.75.66
```

---

## Final Instruction to Codex

Work in this order:

1. Verify applied-date guard.
2. Fix it if missing.
3. Run backend tests and frontend build.
4. Run Cypress if stack is available.
5. Stop and report changed files.
6. Do not deploy.
7. Do not change unrelated architecture.
8. Do not touch production.
