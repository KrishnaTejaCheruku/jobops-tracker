#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production.local}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE"
  exit 1
fi

echo "Applying production database migrations using $ENV_FILE"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres

echo "Waiting for PostgreSQL to become ready..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -lc 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do echo "PostgreSQL is not ready yet..."; sleep 2; done'

for file in apps/backend/migrations/*.sql; do
  echo "Applying $file"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$file"
done

echo "Production migrations applied successfully."
