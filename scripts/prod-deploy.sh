#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE"
  echo "Create one from:"
  echo "  cp .env.production.example $ENV_FILE"
  exit 1
fi

if ! grep -q '^POSTGRES_PASSWORD=' "$ENV_FILE"; then
  echo "POSTGRES_PASSWORD is missing in $ENV_FILE"
  exit 1
fi

if [ "$ENV_FILE" = ".env.production" ] && grep -q '^POSTGRES_PASSWORD=change-this-password' "$ENV_FILE"; then
  echo "POSTGRES_PASSWORD still has the example value. Change it before production deployment."
  exit 1
fi

echo "Deploying JobOps Tracker using $ENV_FILE"

echo "Starting PostgreSQL..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build postgres

echo "Applying migrations..."
./scripts/prod-migrate.sh "$ENV_FILE"

echo "Starting full production stack..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

echo "Deployment status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo
echo "Deployment completed."
