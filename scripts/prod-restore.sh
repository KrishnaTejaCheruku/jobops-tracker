#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"
ENV_FILE="${2:-.env.production}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"

if [ -z "$BACKUP_FILE" ]; then
  echo "Backup file is required."
  echo "Usage:"
  echo "  $0 <backup-file> [env-file]"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ ! -s "$BACKUP_FILE" ]; then
  echo "Backup file is empty: $BACKUP_FILE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE"
  exit 1
fi

echo "Restore target environment: ${ENV_FILE}"
echo "Backup file: ${BACKUP_FILE}"
echo
echo "WARNING: This will restore database contents."
read -r -p "Type RESTORE to continue: " confirm

if [ "$confirm" != "RESTORE" ]; then
  echo "Restore aborted."
  exit 1
fi

echo "Starting PostgreSQL..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres

echo "Waiting for PostgreSQL to accept SQL queries..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc '
    until psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; do
      echo "PostgreSQL is not ready for restore yet..."
      sleep 2
    done
  '

echo "Stopping application services before restore..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" stop backend frontend caddy >/dev/null 2>&1 || true

echo "Restoring database..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc 'pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$BACKUP_FILE"

echo "Starting application services..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d backend frontend caddy

echo "Restore completed."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
