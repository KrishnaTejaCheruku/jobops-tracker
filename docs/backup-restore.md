# JobOps Tracker Backup, Restore, And Maintenance

This document explains how to back up, restore, and clean up the PostgreSQL database used by the production Docker Compose deployment.

## Files

```text
scripts/prod-backup.sh
scripts/prod-restore.sh
scripts/prod-backup-cron.sh
scripts/prod-maintenance.sh
```

## Production Backup

Create a backup before every deployment or maintenance run:

```bash
./scripts/prod-backup.sh .env.production
```

Backups are written to:

```text
backups/postgres/
```

## Scheduled Backup Cron

The cron helper creates a backup and removes old `.dump` files after the configured retention window:

```bash
APP_DIR=/opt/jobops-tracker ENV_FILE=.env.production RETENTION_DAYS=7 ./scripts/prod-backup-cron.sh
```

## Maintenance Cleanup

The maintenance script is a dry run by default. It previews:

```text
expired OTP rows eligible for deletion
expired session rows eligible for deletion
backup dump files older than the retention window
```

Run a dry run:

```bash
./scripts/prod-maintenance.sh .env.production
```

Apply cleanup explicitly:

```bash
CONFIRM_PROD_MAINTENANCE=yes ./scripts/prod-maintenance.sh .env.production
```

Retention knobs:

```text
OTP_RETENTION_DAYS=1
SESSION_RETENTION_DAYS=30
BACKUP_RETENTION_DAYS=14
BACKUP_DIR=backups/postgres
```

Example:

```bash
OTP_RETENTION_DAYS=2 \
SESSION_RETENTION_DAYS=45 \
BACKUP_RETENTION_DAYS=30 \
CONFIRM_PROD_MAINTENANCE=yes \
./scripts/prod-maintenance.sh .env.production
```

The script deletes only expired auth records and old PostgreSQL dump files. It does not delete users, applications, CV versions, or current sessions.

## Restore

Use restore only when intentionally replacing the production database from a known backup.

```bash
./scripts/prod-restore.sh .env.production backups/postgres/jobops-postgres-YYYYMMDD-HHMMSS.dump
```

Read the restore script output carefully before continuing. Restores are destructive to the current database contents.
