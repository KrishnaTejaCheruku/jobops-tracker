# Contributing

JobOps Tracker uses protected `main` and pull-request based development.

## Workflow

1. Start from current `main`.
2. Create a feature branch, for example `feat/short-description` or `fix/short-description`.
3. Keep changes scoped to the task.
4. Run the relevant checks before opening a PR.
5. Open a pull request into `main`.

Do not push directly to `main`.

## Commits

Use concise conventional-style messages when practical:

```text
feat: complete landing page product sections
docs: update production deployment guide
fix: validate capture payload size
```

## Required Checks

Use the checks that match the files changed:

```bash
go -C apps/backend fmt ./...
go -C apps/backend test ./...
npm --prefix apps/frontend run build
npm --prefix apps/frontend run test:e2e
npm --prefix apps/browser-extension test
npm --prefix apps/browser-extension run validate
python3 -m compileall apps/capture-ocr-service/app
```

Docker and Helm changes should also be checked with:

```bash
docker build -t jobops-tracker-backend:ci apps/backend
docker build -t jobops-tracker-frontend:ci -f apps/frontend/Dockerfile.prod --build-arg VITE_API_BASE_URL=/api apps/frontend
helm lint infra/helm/jobops-tracker
helm template jobops-tracker infra/helm/jobops-tracker -n jobops-tracker
```

## Security-Sensitive Changes

Treat these as security-sensitive:

- Authentication, OTP, session, cookie, CORS, and SMTP changes.
- User ownership or authorization logic.
- CSV import validation.
- Capture/OCR request handling.
- Production deployment, secrets, and backup/restore changes.

Add focused tests and update [docs/security.md](docs/security.md) when behavior changes.

## Documentation

Update documentation with the same PR when code, scripts, environment variables, or infrastructure behavior changes. Keep links valid and document incomplete functionality honestly.
