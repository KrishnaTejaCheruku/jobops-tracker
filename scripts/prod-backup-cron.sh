#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/jobops-tracker}"
ENV_FILE="${ENV_FILE:-.env.production}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

cd "$APP_DIR"

./scripts/prod-backup.sh "$ENV_FILE"

find backups/postgres -type f -name "*.dump" -mtime +"$RETENTION_DAYS" -delete
