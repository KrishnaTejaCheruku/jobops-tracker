#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"
DEPLOY_MODE="${JOBOPS_DEPLOY_MODE:-}"

env_value() {
  local key="$1"
  local value

  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  printf '%s' "$value"
}

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

if [ -z "$DEPLOY_MODE" ]; then
  DEPLOY_MODE="$(env_value JOBOPS_DEPLOY_MODE)"
fi

DEPLOY_MODE="${DEPLOY_MODE:-build}"

case "$DEPLOY_MODE" in
  build|pull)
    ;;
  *)
    echo "JOBOPS_DEPLOY_MODE must be either 'build' or 'pull'. Current value: $DEPLOY_MODE"
    exit 1
    ;;
esac

APP_VERSION_VALUE="$(env_value APP_VERSION)"
BACKEND_IMAGE="${BACKEND_IMAGE:-$(env_value BACKEND_IMAGE)}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-$(env_value FRONTEND_IMAGE)}"
ALLOW_LATEST_IMAGE_TAG="${ALLOW_LATEST_IMAGE_TAG:-$(env_value ALLOW_LATEST_IMAGE_TAG)}"

if [ -z "$BACKEND_IMAGE" ] && [ -n "$APP_VERSION_VALUE" ]; then
  BACKEND_IMAGE="jobops-tracker-backend:$APP_VERSION_VALUE"
fi

if [ -z "$FRONTEND_IMAGE" ] && [ -n "$APP_VERSION_VALUE" ]; then
  FRONTEND_IMAGE="jobops-tracker-frontend:$APP_VERSION_VALUE"
fi

export BACKEND_IMAGE="${BACKEND_IMAGE:-jobops-tracker-backend:latest}"
export FRONTEND_IMAGE="${FRONTEND_IMAGE:-jobops-tracker-frontend:latest}"

if [ "$DEPLOY_MODE" = "pull" ]; then
  if [ -z "$BACKEND_IMAGE" ] || [ -z "$FRONTEND_IMAGE" ]; then
    echo "BACKEND_IMAGE and FRONTEND_IMAGE are required when JOBOPS_DEPLOY_MODE=pull."
    exit 1
  fi

  if { [ "${BACKEND_IMAGE##*:}" = "latest" ] || [ "${FRONTEND_IMAGE##*:}" = "latest" ]; } &&
    [ "${ALLOW_LATEST_IMAGE_TAG:-no}" != "yes" ]; then
    echo "Pinned image deploy refuses ':latest'. Use an explicit tag or set ALLOW_LATEST_IMAGE_TAG=yes."
    exit 1
  fi
fi

echo "Deploying JobOps Tracker using $ENV_FILE"
echo "Deployment mode: $DEPLOY_MODE"

echo "Starting PostgreSQL..."
if [ "$DEPLOY_MODE" = "build" ]; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build postgres
else
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres
fi

echo "Applying migrations..."
./scripts/prod-migrate.sh "$ENV_FILE"

echo "Starting full production stack..."
if [ "$DEPLOY_MODE" = "build" ]; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
else
  echo "Pulling pinned backend and frontend images..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull backend frontend
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --no-build
fi

echo "Deployment status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo
echo "Deployment completed."
