#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"

echo "=== JobOps Tracker production monitor ==="
echo "Environment file: ${ENV_FILE}"
echo

echo "=== Docker Compose status ==="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo
echo "=== Health check ==="
./scripts/prod-healthcheck.sh

echo
echo "=== Container resource usage ==="
docker stats --no-stream \
  jobops-tracker-prod-caddy-1 \
  jobops-tracker-prod-frontend-1 \
  jobops-tracker-prod-backend-1 \
  jobops-tracker-prod-postgres-1 || true

echo
echo "=== Disk usage ==="
df -h /

echo
echo "=== Docker disk usage ==="
docker system df

echo
echo "=== Latest backups ==="
ls -lh backups/postgres 2>/dev/null | tail -n 10 || echo "No backups found yet."

echo
echo "=== Recent backup cron log ==="
tail -n 30 /var/log/jobops-backup.log 2>/dev/null || echo "No backup cron log found yet."

echo
echo "=== Recent Caddy access logs ==="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T caddy \
  sh -lc 'tail -n 20 /var/log/caddy/access.log 2>/dev/null || echo "No Caddy access log found yet."' || true

echo
echo "=== Recent backend logs ==="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=40 backend
