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
Verify and finalize applied_date future-date guard
```

### Step 1 — Inspect Current Code

Run:

```bash
grep -R "applied_date cannot be in the future\|max=.*applied\|max={.*today\|applied_date" -n \
  apps/frontend/src \
  apps/backend/internal/validation \
  apps/backend/internal/handlers
```

Inspect these files:

```bash
cat apps/frontend/src/components/ApplicationForm.jsx
cat apps/frontend/src/App.jsx
cat apps/backend/internal/validation/applications.go
cat apps/backend/internal/handlers/applications.go
cat apps/backend/internal/handlers/applications_csv.go
```

### Step 2 — Frontend Applied Date Guard

Implement or verify:

1. New application form defaults `applied_date` to today.
2. Resetting form after create/cancel resets `applied_date` to today.
3. Editing an existing application preserves valid historical `applied_date`.
4. `ApplicationForm.jsx` date input for `applied_date` uses local today as max:

```jsx
max={today}
```

5. Do not restrict `follow_up_date`.
6. If future date is somehow typed or selected, frontend should prevent submission or normalize before submit.

Preferred helper:

```javascript
function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
```

### Step 3 — Backend Applied Date Validation

In backend validation, ensure:

1. `applied_date` is valid date format if provided.
2. `applied_date` cannot be after today.
3. Validation error field is:

```text
applied_date
```

4. Validation message is:

```text
applied_date cannot be in the future
```

Create and update paths must both use this validation.

CSV import must use the same create validation so rows with future `applied_date` fail row-level import.

### Step 4 — Backend Tests

If existing validation tests exist, add tests for:

```text
Create application with future applied_date -> validation error
Update application with future applied_date -> validation error
Create application with today applied_date -> valid
Create application with historical applied_date -> valid
Follow_up_date future -> valid
```

Do not create a huge test framework if no test pattern exists, but prefer adding tests to existing validation test files.

---

## Verification Commands

### Backend Format and Tests

```bash
go -C apps/backend fmt ./...
go -C apps/backend test ./...
```

### Frontend Build

```bash
cd apps/frontend
npm run build
cd ../..
```

### Cypress

Run if local stack is available:

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

---

## Manual Auth Smoke Test

Unauthenticated route:

```bash
curl -i http://localhost:8000/applications
```

Expected:

```text
401 Unauthorized
```

Request OTP:

```bash
curl -s -X POST http://localhost:8000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Use returned `debug_otp`:

```bash
OTP="PASTE_OTP"

curl -i -c /tmp/jobops-auth-cookies.txt \
  -X POST http://localhost:8000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"otp\":\"${OTP}\"}"
```

Authenticated route:

```bash
curl -i -b /tmp/jobops-auth-cookies.txt http://localhost:8000/applications
```

Expected:

```text
200 OK
```

---

## Manual Future Applied Date API Test

Use authenticated cookie:

```bash
curl -i -b /tmp/jobops-auth-cookies.txt \
  -X POST http://localhost:8000/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Future Date Guard Test",
    "company_name": "Date Guard GmbH",
    "source": "LinkedIn",
    "job_url": "https://example.com/future-date-guard",
    "location": "Remote",
    "work_mode": "Remote",
    "status": "Applied",
    "priority": "High",
    "applied_date": "2099-01-01"
  }'
```

Expected:

```text
400 Bad Request
```

Expected response should include:

```text
applied_date cannot be in the future
```

---

## Frontend Browser Test for Date Guard

Run local frontend/backend and open:

```text
http://localhost:5173
```

Test flow:

1. Login with `test@example.com`.
2. Use dev OTP.
3. Dashboard loads.
4. Open application form.
5. Confirm `Applied Date` defaults to today.
6. Try selecting tomorrow.
7. Expected: tomorrow cannot be selected.
8. Confirm `Follow Up Date` can still be future.
9. Create application.
10. Expected: application is created with valid applied date.

---

## Suggested Commit for Date Fix

After tests pass:

```bash
git status --short
git diff --stat
```

Suggested commit:

```bash
git add apps/frontend/src/App.jsx \
  apps/frontend/src/components/ApplicationForm.jsx \
  apps/backend/internal/validation/applications.go \
  apps/backend/internal/handlers/applications.go \
  apps/backend/internal/handlers/applications_csv.go

git commit -m "fix: prevent future applied dates"
git push
```

Only add files that actually changed.

---

## Next Major Phase After Date Fix

After the date fix, move to production readiness for auth deployment.

Do not deploy yet.

First prepare documentation and deployment checks.

---

## Production Auth Rollout Checklist

Create or update:

```text
docs/auth-production-rollout.md
```

The document should include:

1. Why backend and frontend auth must deploy together.
2. Pre-deployment backup command.
3. Required migrations:

   * `006_add_auth_tables.sql`
   * `007_add_user_ownership.sql`
4. How to verify migrations on VPS.
5. Required production environment variables:

   * `APP_ENV=production`
   * `AUTH_SECRET=<strong secret>`
   * `AUTH_COOKIE_SECURE=false` until HTTPS/domain exists
   * later `AUTH_COOKIE_SECURE=true` after HTTPS/domain
   * `CORS_ALLOWED_ORIGINS` if supported
6. Current OTP behavior:

   * Dev mode returns `debug_otp`
   * Production must not expose debug OTP
   * SMTP delivery is not yet implemented
7. Risk:

   * If deployed now with `APP_ENV=production` and no SMTP delivery, OTP will be logged server-side but not visible to user.
8. Recommendation:

   * Do not enable public production login until SMTP OTP delivery is implemented.
   * Or keep `APP_ENV` non-production temporarily only for demo, but do not treat that as secure production.

---

## Next Engineering Phase: SMTP OTP Delivery

After production rollout docs, implement SMTP-based OTP delivery.

Do not integrate an external provider SDK first. Keep it simple.

Suggested design:

```text
OTPDelivery interface
LogOTPDelivery for local/dev
SMTPOTPDelivery for production
```

Suggested environment variables:

```text
OTP_DELIVERY_MODE=log|smtp
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM
SMTP_FROM_NAME
```

Rules:

```text
development -> log OTP and optionally return debug_otp
production + smtp -> send OTP by email
production + log -> allowed only if explicitly configured for internal demo, but warn in docs
```

Backend endpoint behavior:

```text
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

## Next Engineering Phase: Production Deploy

Only after:

```text
Applied-date guard is complete
Auth tests pass
SMTP or acceptable demo OTP behavior is decided
Migration flow is confirmed
Production backup is taken
```

Production deploy steps should include:

```bash
ssh root@94.130.75.66
cd /opt/jobops-tracker
./scripts/prod-backup.sh .env.production
git pull
./scripts/prod-deploy.sh .env.production
./scripts/prod-healthcheck.sh
./scripts/prod-monitor.sh .env.production
```

Verify:

```bash
curl http://94.130.75.66/api/health
```

Browser verify:

```text
http://94.130.75.66
```

Do not switch `AUTH_COOKIE_SECURE=true` until HTTPS is enabled.

---

## Next Engineering Phase: Domain + HTTPS

Later, when domain is purchased:

1. Point DNS A record to:

```text
94.130.75.66
```

2. Update `.env.production`:

```text
JOBOPS_SITE_ADDRESS=yourdomain.com
ACME_EMAIL=your-email
AUTH_COOKIE_SECURE=true
```

3. Use `infra/caddy/Caddyfile.domain.example` as the production Caddyfile shape if you want unknown host headers to return `404`.

4. Redeploy Caddy.

5. Verify:

```bash
curl -I https://yourdomain.com
curl https://yourdomain.com/api/health
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
curl http://94.130.75.66/api/health
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
