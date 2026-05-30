#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-status}"
ENV_FILE="${2:-.env.production}"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE"
  exit 1
fi

case "$ACTION" in
  status)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    ;;
  logs)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f --tail=120
    ;;
  restart)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" restart
    ;;
  stop)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
    ;;
  stop-with-volumes)
    echo "WARNING: this removes production database volumes."
    read -r -p "Type DELETE to continue: " confirm
    if [ "$confirm" != "DELETE" ]; then
      echo "Aborted."
      exit 1
    fi
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v
    ;;
  pull-build)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build
    ;;
  *)
    echo "Unknown action: $ACTION"
    echo "Usage:"
    echo "  $0 status [env-file]"
    echo "  $0 logs [env-file]"
    echo "  $0 restart [env-file]"
    echo "  $0 stop [env-file]"
    echo "  $0 stop-with-volumes [env-file]"
    echo "  $0 pull-build [env-file]"
    exit 1
    ;;
esac
