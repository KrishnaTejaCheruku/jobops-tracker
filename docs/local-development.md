# Local Development

## Prerequisites

- Docker and Docker Compose.
- Go matching `apps/backend/go.mod`.
- Node.js compatible with the workflows, currently Node 24 in CI.
- Python 3 for OCR syntax checks and local OCR development.

## Environment

```bash
cp .env.example .env
```

Development defaults use:

```text
APP_ENV=development
OTP_DELIVERY_MODE=log
AUTH_COOKIE_SECURE=false
DATABASE_URL=postgresql://jobops:jobops_dev_password@postgres:5432/jobops
```

## Docker Compose

Start the local stack:

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build
```

Services:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
OCR:      http://localhost:8090
Postgres: localhost:5432
```

Stop:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

## Backend

Run directly when PostgreSQL is available:

```bash
go -C apps/backend run ./cmd/api
```

Tests:

```bash
go -C apps/backend fmt ./...
go -C apps/backend test ./...
```

## Frontend

```bash
npm --prefix apps/frontend install
npm --prefix apps/frontend run dev
npm --prefix apps/frontend run build
```

## Database Migrations

Local development currently relies on applying SQL files from `apps/backend/migrations` when initializing a database. Production migration automation is implemented in `scripts/prod-migrate.sh`.

## Cypress

Start the local app stack, then run:

```bash
npm --prefix apps/frontend run test:e2e
```

## OCR Service

Source lives in `apps/capture-ocr-service`.

Syntax validation:

```bash
python3 -m compileall apps/capture-ocr-service/app
```

The Docker image installs the OCR dependencies from `apps/capture-ocr-service/requirements.txt`.

## Browser Extension

```bash
npm --prefix apps/browser-extension test
npm --prefix apps/browser-extension run validate
npm --prefix apps/browser-extension run package
```

Load `apps/browser-extension/dist/chrome` as an unpacked Chrome extension after packaging.
