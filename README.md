# JobOps Tracker

JobOps Tracker is an open-source, self-hosted job application tracking platform for DevOps engineers and cloud professionals.

Live site:

```text
https://jobops.me
https://www.jobops.me
```

It replaces manual Excel-based job tracking with a modern application dashboard for job applications, CV versions, follow-ups, interviews, and job-search analytics.

## Why this project exists

Tracking job applications manually in spreadsheets becomes messy quickly. JobOps Tracker provides a structured, self-hosted alternative that can run locally using Docker and later on Kubernetes.

The project is also designed as a cloud-native DevOps portfolio project using:

- Docker
- Kubernetes
- Helm
- OpenTofu / Terraform-style IaC
- Ansible
- PostgreSQL
- Go
- React
- Caddy

## Production

The live deployment runs on a Hetzner VPS with Docker Compose, Caddy, PostgreSQL, and pinned GHCR images.

Current production release:

```text
Backend:  ghcr.io/krishnatejacheruku/jobops-tracker-backend:v0.6.0
Frontend: ghcr.io/krishnatejacheruku/jobops-tracker-frontend:v0.6.0
Domains:  https://jobops.me, https://www.jobops.me
```

Release flow:

1. Merge changes to protected `main` through pull requests.
2. Tag a release such as `v0.6.0`.
3. GitHub Actions publishes backend and frontend images to GHCR.
4. The VPS pulls the pinned image tags with `JOBOPS_DEPLOY_MODE=pull`.
5. Production is verified with HTTPS, API health checks, and an OTP login smoke test.

## Product Features

- Passwordless OTP authentication
- Private, user-scoped application data
- Job application CRUD
- Application statuses, priorities, sources, locations, and work modes
- Applied-date validation and follow-up tracking
- CV version tracking
- Status history
- Analytics dashboard
- CSV import/export
- Duplicate detection during CSV import
- Light/dark theme toggle
- Production HTTPS deployment

## Platform Features

- Docker Compose local and production environments
- Caddy reverse proxy with HTTPS, HTTP-to-HTTPS redirects, HSTS, and probe-path hardening
- PostgreSQL migrations, backup, restore, and health-check scripts
- GitHub Actions CI and image publishing
- Manual VPS deploy workflow
- GitHub hardening and production release runbook
- Pinned GHCR image production deployment
- Ansible VPS bootstrap/deploy automation
- Kubernetes manifests and Helm chart
- OpenTofu Hetzner scaffold

## Project Status

Production deployment is live at `https://jobops.me` and `https://www.jobops.me` with HTTPS, HTTP-to-HTTPS redirects, HSTS, passwordless OTP authentication, user-scoped application data, CSV import/export, analytics, Docker Compose deployment, Caddy reverse proxy, PostgreSQL backups, and pinned `v0.6.0` GHCR images.

Operational docs:

- [Production release runbook](docs/production-release-runbook.md)
- [Monitoring guide](docs/monitoring.md)
- [Backup and restore guide](docs/backup-restore.md)
- [Portfolio case study](docs/portfolio-case-study.md)

Next planned operations phase: production monitoring screenshots, Alertmanager wiring if needed, and a portfolio case-study writeup.

## License

MIT License.
