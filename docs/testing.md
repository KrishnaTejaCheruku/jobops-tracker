# Testing

## Backend

```bash
go -C apps/backend fmt ./...
go -C apps/backend test ./...
```

Backend tests cover handlers, validation, OTP behavior, dashboard analytics, metrics, capture analyze, and security regressions.

## Frontend Build

```bash
npm --prefix apps/frontend run build
```

## Cypress

Start the local stack:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres backend frontend
```

Run e2e tests:

```bash
npm --prefix apps/frontend run test:e2e
```

The frontend Cypress config lives at `apps/frontend/cypress.config.js`.

## OCR Service

Syntax check:

```bash
python3 -m compileall apps/capture-ocr-service/app
```

Unit tests can be run with pytest when dependencies are installed:

```bash
python3 -m pytest apps/capture-ocr-service/app
```

The required validation for lightweight syntax checks does not download PaddleOCR models.

## Browser Extension

```bash
npm --prefix apps/browser-extension test
npm --prefix apps/browser-extension run validate
npm --prefix apps/browser-extension run package
```

## Docker Image Builds

```bash
docker build -t jobops-tracker-backend:ci apps/backend
docker build -t jobops-tracker-frontend:ci -f apps/frontend/Dockerfile.prod --build-arg VITE_API_BASE_URL=/api apps/frontend
```

## Helm Validation

```bash
helm lint infra/helm/jobops-tracker
helm template jobops-tracker infra/helm/jobops-tracker -n jobops-tracker
```

## GitHub Checks

The CI workflow runs backend checks, frontend build/Cypress, extension tests/validation/package build, Docker image builds, and Helm lint/template.

The release-images workflow publishes backend and frontend images to GHCR for tags matching `v*`.
