# Disaster Recovery & Backup Operations Handbook

This document outlines the operational procedures for backing up, restoring, and verifying the state of the SJ Cloud platform.

## Backup Architecture
The backup system takes consistent snapshots of stateful services (PostgreSQL, Redis) and file system configurations (Traefik dynamic routers).

Backup outputs:
- Compressed tarball containing SQL schemas, RDB snapshots, and configs.
- SHA256 checksum signature file for integrity validation.
- Cloud archive stored securely inside MinIO `backups` bucket.

## Automated Procedures

### 1. Generating a Backup
To create a manual backup snapshot, run:
```bash
./infrastructure/backups/backup.sh
```
This script runs in three parts:
- Connects to Postgres and runs `pg_dump` on `sj_tenant_manager`, `sj_auth`, and `sj_billing`.
- Connects to Redis and triggers a background database save (`BGSAVE`), copying the output database dump.
- Copies Traefik config folders, compresses them all, generates a SHA256 hash, and uploads it to MinIO.

### 2. Restoring from a Backup
To restore the platform to the most recent backup archive, run:
```bash
./infrastructure/backups/restore.sh
```
To restore a specific backup, pass the filename as an argument:
```bash
./infrastructure/backups/restore.sh sj-backup-YYYYMMDDHHMMSS.tar.gz
```
The script will:
- Check the SHA256 hash of the archive against the signature file.
- Unpack files, drop and recreate database tables, and import the SQL dumps.
- Restart the Redis cache container to reload the RDB state.

### 3. Verifying Backup Integrity
To verify the integrity of the backup/restore engine, run:
```bash
./infrastructure/backups/verification.sh
```
This runs a non-destructive transaction validation test:
- Inserts a verification record in PostgreSQL.
- Triggers a backup.
- Mutates/deletes the record in Postgres.
- Runs a restore.
- Asserts that the verification record is successfully restored.

## Retention and SLA Policies
- **Local Retention**: Backups are kept locally in `infrastructure/backups/archives/` for **7 days**. Older archives are automatically pruned.
- **Cloud Retention**: MinIO `backups` bucket has an active Lifecycle Rule that expires objects after **7 days**.
