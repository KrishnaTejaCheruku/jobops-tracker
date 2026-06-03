#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-backups/postgres}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
OTP_RETENTION_DAYS="${OTP_RETENTION_DAYS:-1}"
SESSION_RETENTION_DAYS="${SESSION_RETENTION_DAYS:-30}"
CONFIRM_PROD_MAINTENANCE="${CONFIRM_PROD_MAINTENANCE:-no}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE"
  echo "Usage:"
  echo "  $0 [env-file]"
  exit 1
fi

for value_name in BACKUP_RETENTION_DAYS OTP_RETENTION_DAYS SESSION_RETENTION_DAYS; do
  value="${!value_name}"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "${value_name} must be a non-negative integer, got: ${value}"
    exit 1
  fi
done

echo "Running JobOps production maintenance using ${ENV_FILE}"
echo

echo "=== Auth cleanup preview ==="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc "psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" <<SQL
SELECT COUNT(*) AS expired_otps_to_delete
FROM user_otps
WHERE expires_at < NOW() - INTERVAL '${OTP_RETENTION_DAYS} days';

SELECT COUNT(*) AS expired_sessions_to_delete
FROM user_sessions
WHERE expires_at < NOW() - INTERVAL '${SESSION_RETENTION_DAYS} days';
SQL"

echo
echo "=== Backup retention preview ==="
if [ -d "$BACKUP_DIR" ]; then
  find "$BACKUP_DIR" -type f -name "*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -print
else
  echo "Backup directory not found: $BACKUP_DIR"
fi

if [ "$CONFIRM_PROD_MAINTENANCE" != "yes" ]; then
  echo
  echo "Dry run only. No rows or backups were deleted."
  echo "To apply cleanup:"
  echo "  CONFIRM_PROD_MAINTENANCE=yes $0 $ENV_FILE"
  exit 0
fi

echo
echo "=== Applying auth cleanup ==="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc "psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" <<SQL
WITH deleted_otps AS (
  DELETE FROM user_otps
  WHERE expires_at < NOW() - INTERVAL '${OTP_RETENTION_DAYS} days'
  RETURNING id
)
SELECT COUNT(*) AS deleted_expired_otps
FROM deleted_otps;

WITH deleted_sessions AS (
  DELETE FROM user_sessions
  WHERE expires_at < NOW() - INTERVAL '${SESSION_RETENTION_DAYS} days'
  RETURNING id
)
SELECT COUNT(*) AS deleted_expired_sessions
FROM deleted_sessions;
SQL"

echo
echo "=== Applying backup retention ==="
if [ -d "$BACKUP_DIR" ]; then
  find "$BACKUP_DIR" -type f -name "*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -print -delete
else
  echo "Backup directory not found: $BACKUP_DIR"
fi

echo
echo "Production maintenance completed."
