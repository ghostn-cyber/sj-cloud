# Backup Verification operations

The backup verifier checks file exists, size non-zero, and checks integrity using SHA-256 signatures.

## Running Verification Check
Request a verification check:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"id": "bak-101", "type": "tenant", "path": "/storage/backups/t1.tar.gz", "sha256": "digest..."}' \
  http://localhost:8083/admin/backups
```
