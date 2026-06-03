# Auth Production Rollout

Use this checklist before deploying authentication and user-owned application data.

## Deploy Backend And Frontend Together

Authentication changes must roll out as one frontend/backend release. The backend protects `/applications`, `/cv-versions`, and `/dashboard/analytics`; the frontend must include the auth gate and OTP flow at the same time. Deploying only the backend auth changes would turn existing dashboard API calls into `401 Unauthorized` responses that the old frontend cannot handle.

## Pre-Deployment Backup

Create a production backup before running migrations or replacing containers:

```bash
./scripts/prod-backup.sh
```

Confirm the backup artifact exists and keep it outside the deploy directory before continuing.

## Required Migrations

The auth rollout depends on these migrations running in order:

```text
apps/backend/migrations/006_add_auth_tables.sql
apps/backend/migrations/007_add_user_ownership.sql
```

Verify the VPS database has the expected tables and ownership columns:

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "\\dt users user_otps user_sessions"

docker compose -f infra/docker/docker-compose.prod.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "\\d applications"
```

Confirm `applications.user_id` and `cv_versions.user_id` exist before allowing traffic to the auth-protected API.

## Production Environment

Required backend variables:

```text
APP_ENV=production
AUTH_SECRET=<long random secret>
AUTH_COOKIE_SECURE=false
OTP_DELIVERY_MODE=smtp
SMTP_HOST=<smtp host>
SMTP_PORT=587
SMTP_USERNAME=<smtp username>
SMTP_PASSWORD=<smtp password>
SMTP_FROM=<sender address>
SMTP_FROM_NAME=JobOps Tracker
```

Keep `AUTH_COOKIE_SECURE=false` until the app is served over HTTPS with a real domain. Change it to `true` after HTTPS is active.

If cross-origin production hosting is introduced, configure `CORS_ALLOWED_ORIGINS` after backend support is added. The current backend uses a fixed allowlist.

## Caddy Host And Probe Handling

The active production Caddyfile returns `404` for common sensitive probe paths such as `/.env`, `/.git*`, `/backup*`, `/phpmyadmin*`, and WordPress scanner URLs before requests reach the frontend.

While `JOBOPS_SITE_ADDRESS=:80`, the app intentionally serves the frontend for any host header on port 80. After a real domain is configured, use `infra/caddy/Caddyfile.domain.example` as the Caddyfile shape so unknown hosts return `404` and only `JOBOPS_SITE_ADDRESS` serves the app.

## OTP Behavior

Development defaults to `OTP_DELIVERY_MODE=log` and returns `debug_otp` from `POST /auth/request-otp`.

Production defaults to `OTP_DELIVERY_MODE=smtp` and does not return `debug_otp`. OTPs are emailed through SMTP. `OTP_DELIVERY_MODE=log` can be used in production only for a controlled internal demo, and it means codes are visible in backend logs rather than emailed.

OTP requests are throttled per user email to 5 requests per 15 minutes. OTP verification remains capped at 5 attempts per code.

Do not enable public production login unless SMTP delivery is configured and tested.

## Post-Deployment Checks

After deployment, verify:

```bash
curl -i http://94.130.75.66/api/health
```

Then smoke-test the browser flow:

1. Open the production frontend.
2. Request an OTP for a test email address.
3. Confirm the email arrives and no `debug_otp` is present in the response.
4. Verify the OTP.
5. Confirm the dashboard loads only that user's applications.
6. Log out and confirm the auth gate appears again.
