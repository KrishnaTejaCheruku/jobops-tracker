#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-backups/postgres}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/jobops-postgres-${TIMESTAMP}.dump"

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE"
  echo "Usage:"
  echo "  $0 [env-file]"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup using ${ENV_FILE}"
echo "Backup file: ${BACKUP_FILE}"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres

echo "Waiting for PostgreSQL to accept SQL queries..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc '
    until psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; do
      echo "PostgreSQL is not ready for backup yet..."
      sleep 2
    done
  '

echo "Running pg_dump..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "Backup failed: backup file is empty"
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "Backup completed successfully:"
echo "$BACKUP_FILE"
