#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://localhost/api/health}"

echo "Checking JobOps health endpoint: $HEALTH_URL"

response="$(curl -fsS "$HEALTH_URL")"

echo "$response"

echo "$response" | grep -q '"status":"ok"'
echo "$response" | grep -q '"database":"ok"'

echo "JobOps health check passed."
