# Troubleshooting

## Frontend Cannot Reach Backend

Check `VITE_API_BASE_URL`. Local Docker Compose sets it to `http://localhost:8000`. Production images normally use `/api` so Caddy can proxy requests.

Check backend health:

```bash
curl http://localhost:8000/health
```

## OTP Email Does Not Arrive

For development, `OTP_DELIVERY_MODE=log` is expected and the API may return `debug_otp`.

For production, verify:

```text
APP_ENV=production
OTP_DELIVERY_MODE=smtp
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM
SMTP_FROM_NAME
```

Also check backend logs through `scripts/prod-ops.sh logs .env.production`.

## Capture Analyze Returns 503

`CAPTURE_ANALYZE_ENABLED=false` disables the endpoint. Enable it explicitly when capture analysis should be available.

## Capture Analyze Returns 502

The backend could not reach the OCR service. Check:

```text
CAPTURE_OCR_URL
capture-ocr service status
http://localhost:8090/health
```

## CSV Import Fails

Use headers documented in [CSV import/export](csv-import-export.md). Required application fields are `job_title` and `company_name`; date fields must use `YYYY-MM-DD`.

## Cypress Cannot Start

Start the app stack first:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres backend frontend
```

Then run:

```bash
npm --prefix apps/frontend run test:e2e
```

## Production Deploy Refuses `latest`

Pinned-image deploy mode rejects `:latest` unless `ALLOW_LATEST_IMAGE_TAG=yes` is explicitly set. Use immutable version tags for backend and frontend images.
