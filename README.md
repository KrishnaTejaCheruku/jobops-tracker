# JobOps Tracker

JobOps Tracker is a private, open-source workspace for organizing job applications, CV versions, follow-ups, interview progress, outcomes, and CSV data without relying on spreadsheets.

Live site: [https://jobops.me](https://jobops.me)

GitHub repository: [KrishnaTejaCheruku/jobops-tracker](https://github.com/KrishnaTejaCheruku/jobops-tracker)

## Verified Features

- Passwordless OTP authentication with HttpOnly session cookies.
- User-scoped application, CV version, dashboard, and CSV data.
- Application CRUD with validation, search, filters, sorting, and pagination.
- Status history, follow-up tracking, priority, source, work mode, dates, recruiter fields, and notes.
- CV version tracking and application-to-CV association.
- Dashboard analytics, pipeline breakdown, follow-up summaries, and responsive dashboard views.
- CSV import/export with duplicate detection, update, skip, and error reporting.
- Manual URL capture and browser-extension capture with OCR-assisted extraction.
- Review-before-save capture workflow; OCR extraction does not automatically write to the database.
- Light/dark theme support.
- Docker Compose development and production files, Caddy reverse proxy, PostgreSQL migrations, backup/restore scripts, Kubernetes manifests, Helm chart, Ansible, and OpenTofu scaffolds.

## Architecture

The repository contains a React/Vite frontend, Go/Gin API, PostgreSQL database, optional Python/FastAPI OCR service, Manifest V3 browser extension, Docker Compose runtime, Caddy reverse proxy, and optional Kubernetes/Helm/Ansible/OpenTofu deployment assets.

See [Architecture](docs/architecture.md) for the component diagram and implementation details.

## Technology Stack

- Frontend: React 19, Vite, Cypress.
- Backend: Go, Gin, pgx, PostgreSQL.
- Capture OCR service: FastAPI, PaddleOCR, Pillow.
- Browser extension: Manifest V3, local scripts, Node test runner.
- Infrastructure: Docker Compose, Caddy, Helm, Kubernetes manifests, Ansible, OpenTofu.
- CI/CD: GitHub Actions for Go tests, frontend build/Cypress, extension validation, Docker builds, Helm lint/template, image publishing on tags, and manual VPS deploy workflow.

## Quick Start

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up -d --build
```

Open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000/health
OCR:      http://localhost:8090/health
```

Development OTP delivery defaults to log/debug mode. The frontend displays the development OTP returned by the API when `APP_ENV` is not `production`.

## Documentation

Start with [docs/README.md](docs/README.md).

Core guides:

- [Product guide](docs/product-guide.md)
- [Local development](docs/local-development.md)
- [API reference](docs/api.md)
- [Architecture](docs/architecture.md)
- [Browser extension](docs/browser-extension.md)
- [OCR capture service](docs/ocr-capture-service.md)
- [Production deployment](docs/production-deployment.md)
- [Backup and restore](docs/backup-restore.md)
- [Security](docs/security.md)
- [Testing](docs/testing.md)
- [Troubleshooting](docs/troubleshooting.md)

## Security Note

Security-sensitive behavior is documented in [docs/security.md](docs/security.md). Report vulnerabilities through [SECURITY.md](SECURITY.md). Do not commit production secrets, SMTP credentials, database passwords, private keys, or tokens.

## Contributing

Use feature branches and pull requests into protected `main`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Status

The project is a product-style open-source portfolio application. The live deployment is available at `https://jobops.me`; deployment changes must still go through review and must not be pushed directly to `main`.

## License

[MIT License](LICENSE).
