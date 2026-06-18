# Roadmap

This roadmap reflects the current repository state.

## Completed

- Job application CRUD.
- Status history.
- Follow-up tracking.
- CV version tracking.
- Dashboard analytics.
- CSV import/export with duplicate handling.
- Frontend and backend validation.
- Passwordless OTP authentication.
- User-scoped application and CV data.
- SMTP OTP delivery.
- OTP request and verification rate limiting.
- Docker Compose local and production environments.
- PostgreSQL migrations, backups, restores, and health checks.
- Caddy reverse proxy with HTTPS support, HSTS, and probe-path hardening.
- Live public domains documented as `https://jobops.me` and `https://www.jobops.me`.
- GitHub Actions CI and backend/frontend image publishing.
- Manual VPS deploy workflow.
- Ansible VPS automation.
- Kubernetes manifests and Helm chart.
- OpenTofu Hetzner scaffold.
- Prometheus-compatible backend `/metrics` endpoint.
- Optional local Prometheus/Grafana monitoring stack.
- Browser extension packaging for Chrome, Edge, and Firefox.
- OCR-assisted capture service.
- Review-before-save capture flow.

## Next

- Add OCR image publishing if production should use a pinned remote OCR image.
- Add production monitoring screenshots.
- Add Alertmanager wiring if external alert delivery is needed.
- Add optional cron/systemd timer documentation for `scripts/prod-maintenance.sh`.
- Continue security hardening around OTP abuse limits and deployment controls.

## Later

- CV file upload.
- Follow-up reminders.
- Public screenshots and architecture diagrams.
- Optional hosted monitoring integration.
