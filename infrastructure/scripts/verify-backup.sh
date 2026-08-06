#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPTS_DIR}/.."
BACKUP_DIR="${INFRA_DIR}/backups"

echo "=========================================="
echo "Starting Automated Backup & Restore Verification..."
echo "=========================================="

# 1. Trigger fresh backup
echo "Creating new backup..."
bash "${BACKUP_DIR}/backup.sh"

# Find latest backup
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}/archives"/sj-backup-*.tar.gz 2>/dev/null | head -n 1)
if [ -z "${LATEST_BACKUP}" ]; then
  echo "ERROR: Backup archive was not created."
  exit 1
fi

echo "Latest backup found: ${LATEST_BACKUP}"

# 2. Verify SHA256 Signature
echo "Checking signature..."
sha256sum --check "${LATEST_BACKUP}.sha256"
echo "  [OK] SHA256 checksum matches."

# 3. Test extraction and verify file presence
echo "Testing archive extraction..."
TEMP_DIR="/tmp/sj-backup-verify-$(date +%s)"
mkdir -p "${TEMP_DIR}"
tar -xzf "${LATEST_BACKUP}" -C "${TEMP_DIR}"

expected_files=(
  "tenant_manager.sql"
  "auth.sql"
  "billing.sql"
  "dump.rdb"
)

for file in "${expected_files[@]}"; do
  if [ -s "${TEMP_DIR}/${file}" ]; then
    echo "  [OK] ${file} is present and not empty."
  else
    echo "ERROR: Missing or empty backup file: ${file}"
    rm -rf "${TEMP_DIR}"
    exit 1
  fi
done

rm -rf "${TEMP_DIR}"

# 4. Trigger Restore to verify recoverability
echo "Running restore test..."
bash "${BACKUP_DIR}/restore.sh"

echo "=========================================="
echo "Backup & Restore verification completed successfully!"
echo "=========================================="
