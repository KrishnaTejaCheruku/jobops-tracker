# Production Release Runbook

This runbook keeps GitHub as the source of truth while making production deploys explicit, reviewable, and easy to roll back.

Current production deploy behavior defaults to pulling code on the VPS and building images locally with `scripts/prod-deploy.sh`. The same script also supports an opt-in pinned-image mode that pulls explicit GHCR image tags.

## Source Of Truth

Keep GitHub as the canonical repository for JobOps Tracker:

- Code review, CI, releases, and portfolio visibility stay on GitHub.
- The VPS should only need read access to the repository.
- Production secrets stay outside GitHub and outside the repository.
- Do not self-host Git unless the goal is specifically to demonstrate GitOps or platform operations.

## GitHub Hardening

Configure the repository with these controls:

- Enable branch protection on `main`.
- Require pull requests before merging to `main`.
- Require the CI workflow to pass before merging.
- Require linear history if the team wants simple rollback and audit history.
- Restrict who can push to `main`.
- Enable Dependabot alerts and security updates.
- Enable secret scanning and push protection where available.
- Keep GitHub Actions permissions minimal; workflows should request only the permissions they need.

The current workflows already use limited permissions for normal CI/image publishing. Keep that pattern when adding future workflows.

## Deploy Key Hardening

Use a read-only deploy key for the VPS repository checkout.

On the VPS, create a dedicated SSH key:

```bash
ssh-keygen -t ed25519 -C "jobops-vps-readonly-deploy" -f ~/.ssh/jobops_vps_deploy
chmod 600 ~/.ssh/jobops_vps_deploy
cat ~/.ssh/jobops_vps_deploy.pub
```

In GitHub:

1. Open the repository settings.
2. Go to `Deploy keys`.
3. Add the public key.
4. Leave write access disabled.

On the VPS, configure the repository remote to use SSH:

```bash
cd /opt/jobops-tracker
git remote set-url origin git@github.com:KrishnaTejaCheruku/jobops-tracker.git
GIT_SSH_COMMAND='ssh -i ~/.ssh/jobops_vps_deploy -o IdentitiesOnly=yes' git fetch origin
```

If the fetch works, persist the SSH key for this repository:

```bash
git config core.sshCommand "ssh -i ~/.ssh/jobops_vps_deploy -o IdentitiesOnly=yes"
git fetch origin
git status
```

Keep the private key only on the VPS. Do not copy it into the repo, GitHub Actions secrets, local notes, or documentation.

## Manual Release

Use tagged releases for deploy candidates:

```bash
git checkout main
git pull --ff-only origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

The `release-images.yml` workflow publishes matching backend and frontend images to GHCR for tags that start with `v`.

Before touching production, verify:

```bash
git status --short
git log --oneline -5
```

Then confirm the release image workflow passed in GitHub Actions.

## Production Deploy

The default deploy mode is source build:

```bash
ssh root@94.130.75.66
cd /opt/jobops-tracker
git fetch origin --tags
git checkout main
git pull --ff-only origin main
./scripts/prod-backup.sh .env.production
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

This mode keeps the existing behavior:

```text
JOBOPS_DEPLOY_MODE=build
```

Verify the public site:

```bash
curl -I https://jobops.me
curl -I https://www.jobops.me
curl https://jobops.me/api/health
curl https://www.jobops.me/api/health
```

Expected result:

```text
HTTPS frontend returns 200
API health returns database ok
HTTPS responses include strict-transport-security
HTTP requests redirect to HTTPS
```

Also smoke-test login in a browser:

1. Open `https://jobops.me`.
2. Request an OTP.
3. Confirm the OTP email arrives.
4. Verify the OTP.
5. Confirm the dashboard loads.
6. Log out.

## Rollback

For source-build deploys, prefer rolling back to the previous known-good Git tag or commit.

```bash
ssh root@94.130.75.66
cd /opt/jobops-tracker
git fetch origin --tags
git checkout <known-good-tag-or-commit>
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

Run the same public health checks after rollback.

Database rollback is separate. If a release included a non-backward-compatible migration, restore from the backup created before deployment:

```bash
./scripts/prod-restore.sh backups/postgres/jobops-postgres-YYYYMMDD-HHMMSS.dump .env.production
```

Do not restore the database unless intentionally replacing production data from a known backup.

## Pinned Image Deploys

Pinned image mode stops building production images on the VPS. GitHub builds and publishes the images, and the VPS pulls an explicit tag.

In `.env.production`, set:

```text
JOBOPS_DEPLOY_MODE=pull
BACKEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-backend:vX.Y.Z
FRONTEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-frontend:vX.Y.Z
```

Then deploy:

```bash
ssh root@94.130.75.66
cd /opt/jobops-tracker
git fetch origin --tags
git pull --ff-only origin main
./scripts/prod-backup.sh .env.production
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

The deploy script refuses `:latest` image tags in pinned-image mode unless `ALLOW_LATEST_IMAGE_TAG=yes` is explicitly set. Keep production on immutable version tags.

Pinned-image rollback is changing the two image variables back to the previous known-good tag:

```text
BACKEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-backend:vPREVIOUS
FRONTEND_IMAGE=ghcr.io/krishnatejacheruku/jobops-tracker-frontend:vPREVIOUS
```

Then run:

```bash
./scripts/prod-deploy.sh .env.production
./scripts/prod-ops.sh status .env.production
```

Run the public health checks after every pinned-image deploy or rollback.
