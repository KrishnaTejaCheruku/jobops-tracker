# Kubernetes

The repository includes raw Kubernetes manifests and a Helm chart for local or experimental deployment work. The documented live production runtime is Docker Compose.

## Raw Manifests

Location:

```text
infra/kubernetes/base
```

Files:

```text
00-namespace.yaml
01-postgres-secret.yaml
02-postgres.yaml
03-backend.yaml
04-frontend.yaml
05-caddy-gateway.yaml
```

Kind cluster helper:

```text
infra/kubernetes/kind/jobops-local.yaml
```

Migration helper:

```text
scripts/k8s-migrate.sh
```

## Helm Chart

Location:

```text
infra/helm/jobops-tracker
```

Validate:

```bash
helm lint infra/helm/jobops-tracker
helm template jobops-tracker infra/helm/jobops-tracker -n jobops-tracker
```

The CI workflow runs Helm lint and template rendering.

## Status

Kubernetes and Helm assets exist in the repository. Verify image tags and environment values before using them for any real deployment.
