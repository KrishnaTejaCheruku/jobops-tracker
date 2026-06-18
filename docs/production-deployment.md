# Production Deployment

Production deployment is represented by `infra/docker/docker-compose.prod.yml` and the scripts in `scripts/`.

Do not commit production secrets. Create a private `.env.production` from `.env.production.example`.

## Compose Stack

Production Compose includes:

- PostgreSQL.
- Go backend.
- Python capture OCR service.
- React production frontend.
- Caddy reverse proxy.

## Environment

Required production values include:

```text
APP_ENV=production
AUTH_SECRET=<long random secret>
AUTH_COOKIE_SECURE=true
OTP_DELIVERY_MODE=smtp
SMTP_HOST=<smtp host>
SMTP_PORT=587
SMTP_USERNAME=<smtp username>
SMTP_PASSWORD=<smtp password>
SMTP_FROM=<sender address>
POSTGRES_PASSWORD=<strong database password>
CORS_ALLOWED_ORIGINS=https://jobops.me,https://www.jobops.me
JOBOPS_SITE_ADDRESS=jobops.me, www.jobops.me
```

Capture settings:

```text
CAPTURE_ANALYZE_ENABLED=true
CAPTURE_OCR_URL=http://capture-ocr:8090
CAPTURE_MAX_BYTES=6000000
```

## Pinned Images

The release workflow publishes backend and frontend images to GHCR for `v*` tags. The current workflow does not publish a capture OCR image.

Pinned-image mode requires explicit backend and frontend image tags:

```text
JOBOPS_DEPLOY_MODE=pull
BACKEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-backend:vX.Y.Z
FRONTEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-frontend:vX.Y.Z
```

Use build mode when building all services, including OCR, from checked-out source:

```text
JOBOPS_DEPLOY_MODE=build
```

## Deploy

On the VPS:

```bash
cd /opt/jobops-tracker
git fetch origin --tags
git checkout main
git pull --ff-only origin main
./scripts/prod-backup.sh .env.production
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

The deploy script starts PostgreSQL, applies SQL migrations, and starts the full stack.

## Caddy And HTTPS

`infra/caddy/Caddyfile` proxies `/api/*` to the backend and all other requests to the frontend. With real domains and ports 80/443, Caddy obtains certificates automatically.

The Caddyfile adds HSTS and blocks common probe paths before they reach the app.

## Health Checks

```bash
curl -I https://jobops.me
curl -I https://www.jobops.me
curl https://jobops.me/api/health
curl https://www.jobops.me/api/health
```

Then smoke-test OTP login in a browser.

## Rollback

For pinned backend/frontend image deploys, change `BACKEND_IMAGE` and `FRONTEND_IMAGE` back to previous known-good tags, then rerun:

```bash
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

Database rollback is separate. Restore only from a known backup when intentionally replacing current production data.

See [Backup and restore](backup-restore.md).
