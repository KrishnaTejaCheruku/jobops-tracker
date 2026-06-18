# Auth Production Deployment Checklist

Use this checklist before deploying authentication or user-ownership changes.

## Required Migrations

Authentication and ownership depend on:

```text
apps/backend/migrations/006_add_auth_tables.sql
apps/backend/migrations/007_add_user_ownership.sql
```

Apply migrations before exposing an auth-protected backend.

## Deployment Rule

Deploy frontend and backend authentication changes together. The backend protects `/applications`, `/cv-versions`, and `/dashboard/analytics`; the frontend must include the auth gate and OTP flow.

## Pre-Deployment Backup

```bash
./scripts/prod-backup.sh .env.production
```

Confirm the backup file exists and is non-empty.

## Environment

Production should use:

```text
APP_ENV=production
AUTH_SECRET=<long random secret>
AUTH_COOKIE_SECURE=true
OTP_DELIVERY_MODE=smtp
CORS_ALLOWED_ORIGINS=https://jobops.me,https://www.jobops.me
```

SMTP variables must be configured before public OTP login is enabled.

## Post-Deployment Checks

```bash
curl https://jobops.me/api/health
curl https://www.jobops.me/api/health
```

Then browser-test:

1. Open `https://jobops.me`.
2. Request an OTP.
3. Confirm SMTP delivery.
4. Complete login.
5. Confirm the dashboard loads only the authenticated user's data.
6. Log out and confirm the auth gate appears.
