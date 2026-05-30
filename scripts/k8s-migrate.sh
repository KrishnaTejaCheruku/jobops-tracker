#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-jobops-tracker}"

echo "Applying Kubernetes database migrations in namespace: ${NAMESPACE}"

kubectl -n "${NAMESPACE}" rollout status statefulset/postgres --timeout=180s

echo "Waiting for PostgreSQL readiness..."
kubectl -n "${NAMESPACE}" exec statefulset/postgres -- \
  sh -lc 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do sleep 2; done'

for file in apps/backend/migrations/*.sql; do
  echo "Applying ${file}"
  kubectl -n "${NAMESPACE}" exec -i statefulset/postgres -- \
    sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "${file}"
done

echo "Kubernetes migrations applied successfully."
