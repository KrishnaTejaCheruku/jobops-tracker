# Docker Guide

## Local Compose

File: `infra/docker/docker-compose.yml`

Services:

- `postgres`
- `backend`
- `capture-ocr`
- `frontend`

Start:

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build
```

Stop:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

## Production Compose

File: `infra/docker/docker-compose.prod.yml`

Services:

- `postgres`
- `backend`
- `capture-ocr`
- `frontend`
- `caddy`

Use `.env.production` for secrets and runtime settings. Do not commit it.

Deploy through:

```bash
./scripts/prod-deploy.sh .env.production
```

## Images

Backend Dockerfile:

```text
apps/backend/Dockerfile
```

Frontend development Dockerfile:

```text
apps/frontend/Dockerfile
```

Frontend production Dockerfile:

```text
apps/frontend/Dockerfile.prod
```

OCR Dockerfile:

```text
apps/capture-ocr-service/Dockerfile
```

The release workflow publishes backend and frontend images. It does not currently publish OCR images.
