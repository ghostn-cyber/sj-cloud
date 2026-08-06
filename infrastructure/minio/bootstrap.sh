#!/bin/sh
set -eu

echo "=========================================="
echo "Starting MinIO Auto-Bootstrap Engine..."
echo "=========================================="

# Read credentials from files if specified
if [ -f "${MINIO_ROOT_USER_FILE:-}" ]; then
  MINIO_ROOT_USER=$(cat "${MINIO_ROOT_USER_FILE}")
fi
if [ -f "${MINIO_ROOT_PASSWORD_FILE:-}" ]; then
  MINIO_ROOT_PASSWORD=$(cat "${MINIO_ROOT_PASSWORD_FILE}")
fi

# Host connection loop
MINIO_URL="http://minio:9000"
until mc alias set local "${MINIO_URL}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null 2>&1; do
  echo "Waiting for MinIO endpoint to become reachable at ${MINIO_URL}..."
  sleep 2
done

echo "MinIO server is online. Client configured successfully."

# Helper function to create bucket and enable versioning
provision_bucket() {
  local name=$1
  local versioning=$2

  if mc ls "local/${name}" >/dev/null 2>&1; then
    echo "  Bucket 'local/${name}' already exists. Skipping creation."
  else
    echo "  Creating bucket 'local/${name}'..."
    mc mb "local/${name}"
  fi

  if [ "${versioning}" = "true" ]; then
    echo "  Enabling versioning on 'local/${name}'..."
    mc version enable "local/${name}"
  fi
}

# Create buckets
provision_bucket "backups" "true"
provision_bucket "artifacts" "true"
provision_bucket "releases" "true"
provision_bucket "tenant-storage" "true"
provision_bucket "logs" "false"

# Configure lifecycle rules: Expire logs after 7 days, expire backups after 7 days
echo "Configuring lifecycle rules..."
mc ilm rule add --expire-days 7 local/logs
mc ilm rule add --expire-days 7 local/backups

echo "=========================================="
echo "MinIO Bootstrap successfully completed!"
echo "=========================================="
mc ls local
