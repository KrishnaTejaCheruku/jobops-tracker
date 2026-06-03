# Monitoring

JobOps Tracker exposes a Prometheus-compatible metrics endpoint from the backend API.

## Metrics Endpoint

```text
GET /metrics
```

Local backend:

```bash
curl http://localhost:8000/metrics
```

Production through Caddy:

```bash
curl https://jobops.me/api/metrics
curl https://www.jobops.me/api/metrics
```

## Current Metrics

```text
jobops_app_uptime_seconds
jobops_database_up
jobops_http_requests_total
jobops_http_request_duration_seconds
```

Labels for HTTP metrics:

```text
method
route
status
```

## Prometheus Scrape Example

```yaml
scrape_configs:
  - job_name: jobops-backend
    metrics_path: /api/metrics
    scheme: https
    static_configs:
      - targets:
          - jobops.me
```

## Optional Local Monitoring Stack

Start the app backend first:

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build backend
```

Start Prometheus and Grafana:

```bash
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d
```

Open:

```text
Prometheus: http://localhost:9090
Grafana: http://localhost:3001
```

Default local Grafana credentials:

```text
admin / jobops-admin
```

Override them with:

```bash
GRAFANA_ADMIN_USER=admin GRAFANA_ADMIN_PASSWORD=<strong-password> \
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d
```

The JobOps dashboard is provisioned automatically from:

```text
infra/monitoring/grafana/dashboards/jobops-overview.json
```

The local Prometheus config scrapes the backend through the host-published port:

```text
host.docker.internal:8000
```

## Files

```text
infra/monitoring/prometheus/prometheus.yml
infra/monitoring/prometheus/alerts.yml
infra/monitoring/grafana/provisioning/datasources/prometheus.yml
infra/monitoring/grafana/provisioning/dashboards/jobops.yml
infra/monitoring/grafana/dashboards/jobops-overview.json
infra/monitoring/docker-compose.monitoring.yml
```

## Suggested Alerts

API unavailable:

```promql
up{job="jobops-backend"} == 0
```

Database unavailable:

```promql
jobops_database_up == 0
```

Elevated server errors:

```promql
sum(rate(jobops_http_requests_total{status=~"5.."}[5m])) > 0
```

OTP throttling activity:

```promql
sum(rate(jobops_http_requests_total{route="/auth/request-otp",status="429"}[15m])) > 0
```

## Verification

Run backend tests:

```bash
go -C apps/backend test ./...
```

Run locally with Docker Compose:

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build backend
curl http://localhost:8000/metrics
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d
curl http://localhost:9090/-/ready
```

Production smoke check:

```bash
curl https://jobops.me/api/health
curl https://jobops.me/api/metrics
```
