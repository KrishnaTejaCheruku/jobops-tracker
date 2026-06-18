# Backup, Restore, And Maintenance

This guide covers PostgreSQL backups for the production Docker Compose stack.

## Files

```text
scripts/prod-backup.sh
scripts/prod-restore.sh
scripts/prod-backup-cron.sh
scripts/prod-maintenance.sh
```

## Backup

Run before deployments and maintenance:

```bash
./scripts/prod-backup.sh .env.production
```

Backups are written to:

```text
backups/postgres/jobops-postgres-YYYYMMDD-HHMMSS.dump
```

Override the directory with:

```bash
BACKUP_DIR=/secure/backups ./scripts/prod-backup.sh .env.production
```

The script starts PostgreSQL if needed, waits for SQL readiness, and writes a custom-format `pg_dump`.

## Restore

Restore replaces the current database contents from a known backup. The restore script prompts for `RESTORE`.

```bash
./scripts/prod-restore.sh backups/postgres/jobops-postgres-YYYYMMDD-HHMMSS.dump .env.production
```

The script starts PostgreSQL, stops backend/frontend/Caddy, runs `pg_restore --clean --if-exists`, then restarts backend/frontend/Caddy.

## Scheduled Backups

The cron helper runs backup and removes old dump files:

```bash
APP_DIR=/opt/jobops-tracker ENV_FILE=.env.production RETENTION_DAYS=7 ./scripts/prod-backup-cron.sh
```

## Maintenance

Dry run:

```bash
./scripts/prod-maintenance.sh .env.production
```

Apply cleanup:

```bash
CONFIRM_PROD_MAINTENANCE=yes ./scripts/prod-maintenance.sh .env.production
```

Retention variables:

```text
OTP_RETENTION_DAYS=1
SESSION_RETENTION_DAYS=30
BACKUP_RETENTION_DAYS=14
BACKUP_DIR=backups/postgres
```

Maintenance deletes only expired OTP rows, expired session rows, and old PostgreSQL dump files. It does not delete users, applications, CV versions, or current sessions.
