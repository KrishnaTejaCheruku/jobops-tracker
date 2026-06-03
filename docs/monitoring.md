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
```

Production smoke check:

```bash
curl https://jobops.me/api/health
curl https://jobops.me/api/metrics
```
