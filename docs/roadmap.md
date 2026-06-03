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
- Ansible VPS automation
- Kubernetes manifests and Helm chart
- OpenTofu Hetzner scaffold
- Prometheus-compatible backend `/metrics` endpoint
- Monitoring guide with scrape and alert examples
- Dry-run production maintenance script for expired OTPs, expired sessions, and backup retention

## Next

### Monitoring And Observability

- Add a Grafana dashboard JSON for API, database, and auth health.
- Add Docker Compose monitoring profile for Prometheus and Grafana.
- Add production dashboard import instructions.

### Maintenance Automation

- Add optional cron/systemd timer documentation for `scripts/prod-maintenance.sh`.
- Add production runbook examples for monthly maintenance review.

### Security Hardening

- Add `Retry-After` header for OTP throttle responses.
- Make CORS allowed origins configurable.
- Consider lightweight IP-based OTP request throttling.
- Decide whether to switch production to the domain-mode Caddyfile with unknown-host `404`.

## Later

- CV file upload.
- Follow-up reminders.
- Public screenshots and architecture diagrams.
- Portfolio case-study writeup.
- Optional hosted monitoring stack.
