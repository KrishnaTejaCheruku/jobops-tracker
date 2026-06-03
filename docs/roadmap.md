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

## Next

### Monitoring And Observability

- Add Prometheus-compatible backend metrics.
- Add `/metrics` documentation and local verification commands.
- Add a Grafana dashboard JSON for API, database, and auth health.
- Add alert-rule examples for API down, database down, and elevated error rates.
- Document production monitoring checks in `docs/monitoring.md`.

### Maintenance Automation

- Add cleanup for expired OTP rows.
- Add cleanup for expired session rows.
- Add backup retention documentation or script support.
- Keep maintenance commands explicit and safe by default.

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
