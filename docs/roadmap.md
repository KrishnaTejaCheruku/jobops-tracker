# Roadmap

This roadmap reflects the current production state of JobOps Tracker.

## Completed

- Job application CRUD
- Status history
- Follow-up tracking
- CV version tracking
- Analytics dashboard
- CSV import/export with duplicate handling
- Frontend validation and backend validation
- Passwordless OTP authentication
- User-scoped application data
- SMTP OTP delivery
- OTP request and verification rate limiting
- Docker Compose local and production environments
- PostgreSQL migrations, backups, restores, and health checks
- Caddy reverse proxy with HTTPS, HTTP-to-HTTPS redirects, HSTS, and probe-path hardening
- Live production domains: `https://jobops.me` and `https://www.jobops.me`
- GitHub Actions CI and image publishing
- Manual VPS deploy workflow
- GitHub hardening and production release runbook
- Opt-in pinned GHCR image deployment mode
- Ansible VPS automation
- Kubernetes manifests and Helm chart
- OpenTofu Hetzner scaffold
- Prometheus-compatible backend `/metrics` endpoint
- Monitoring guide with scrape and alert examples
- Optional Prometheus/Grafana monitoring compose stack
- Grafana dashboard JSON and datasource provisioning
- Dry-run production maintenance script for expired OTPs, expired sessions, and backup retention
- `Retry-After` response header for OTP request throttling
- Configurable `CORS_ALLOWED_ORIGINS`

## Next

### Monitoring And Observability

- Add Alertmanager wiring if external alert delivery is needed.
- Add production monitoring runbook screenshots after deployment.

### Maintenance Automation

- Add optional cron/systemd timer documentation for `scripts/prod-maintenance.sh`.
- Add production runbook examples for monthly maintenance review.

### Security Hardening

- Consider lightweight IP-based OTP request throttling.
- Decide whether to switch production to the domain-mode Caddyfile with unknown-host `404`.
- Apply the GitHub branch protection, secret scanning, and read-only deploy key controls from `docs/production-release-runbook.md`.
- Switch the live VPS environment from `JOBOPS_DEPLOY_MODE=build` to `JOBOPS_DEPLOY_MODE=pull` after a tagged GHCR release is verified.

## Later

- CV file upload.
- Follow-up reminders.
- Public screenshots and architecture diagrams.
- Portfolio case-study writeup.
- Optional hosted monitoring integration.
