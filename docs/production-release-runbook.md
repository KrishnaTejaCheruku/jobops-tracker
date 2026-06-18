# Production Release Runbook

This runbook keeps GitHub as the source of truth while production deploys remain explicit and reviewable.

## Source Of Truth

- Changes land through pull requests into protected `main`.
- Production secrets stay outside GitHub and outside the repository.
- The VPS should need only read access to the repository.
- Do not self-host Git unless that becomes an explicit platform goal.

## GitHub Hardening

Recommended repository controls:

- Branch protection on `main`.
- Pull requests required before merging.
- Required CI workflow.
- Restricted direct pushes.
- Dependabot alerts/security updates.
- Secret scanning and push protection where available.
- Code scanning/CodeQL where available.

## Release Images

`release-images.yml` publishes backend and frontend images to GHCR for tags matching `v*`.

Current workflow outputs:

```text
ghcr.io/krishnatejacheruku/jobops-tracker-backend:<tag>
ghcr.io/krishnatejacheruku/jobops-tracker-frontend:<tag>
```

The workflow does not currently publish a capture OCR image. Use `JOBOPS_DEPLOY_MODE=build` when production should build all services from source, or add an OCR image publishing workflow before relying on a remote OCR image tag.

## Manual Release Candidate

Use reviewed tags only when creating a deploy candidate:

```bash
git checkout main
git pull --ff-only origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

Confirm the release image workflow passed before deploying pinned backend/frontend images.

## Production Deploy

On the VPS:

```bash
cd /opt/jobops-tracker
git fetch origin --tags
git checkout main
git pull --ff-only origin main
./scripts/prod-backup.sh .env.production
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

For pinned backend/frontend image deploys:

```text
JOBOPS_DEPLOY_MODE=pull
BACKEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-backend:vX.Y.Z
FRONTEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-frontend:vX.Y.Z
```

For source builds:

```text
JOBOPS_DEPLOY_MODE=build
```

## Verification

```bash
curl -I https://jobops.me
curl -I https://www.jobops.me
curl https://jobops.me/api/health
curl https://www.jobops.me/api/health
```

Expected:

```text
HTTPS frontend returns 200
API health returns database ok
HTTPS responses include strict-transport-security
HTTP requests redirect to HTTPS
```

Smoke-test OTP login in a browser.

## Rollback

For pinned backend/frontend image deploys, set both image variables back to previous known-good tags and rerun deploy:

```bash
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

Database rollback is separate:

```bash
./scripts/prod-restore.sh backups/postgres/jobops-postgres-YYYYMMDD-HHMMSS.dump .env.production
```

Restore only when intentionally replacing production data from a known backup.
