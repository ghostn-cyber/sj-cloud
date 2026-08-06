#!/usr/bin/env bash
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${TEST_DIR}/.."

echo "=========================================="
echo "Running SJ Cloud Infrastructure Tests..."
echo "=========================================="

FAILED=0

# Helper assertion function
assert_healthy() {
  local container=$1
  if [ "$(docker inspect -f '{{.State.Running}}' "${container}" 2>/dev/null)" = "true" ]; then
    # If health status is defined, verify it
    local health_status=$(docker inspect -f '{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "no-health-check")
    if [ "${health_status}" = "unhealthy" ]; then
      echo "  [FAIL] Container ${container} is UNHEALTHY."
      FAILED=1
    else
      echo "  [PASS] Container ${container} is running (Health: ${health_status})."
    fi
  else
    echo "  [FAIL] Container ${container} is NOT running."
    FAILED=1
  fi
}

# 1. Verify Container Health states
echo "Verifying service container states..."
assert_healthy "sj-docker-socket-proxy"
assert_healthy "sj-traefik"
assert_healthy "sj-registry-api"
assert_healthy "sj-mesh-proxy"
assert_healthy "sj-postgres"
assert_healthy "sj-redis"
assert_healthy "sj-minio"
assert_healthy "sj-prometheus"
assert_healthy "sj-grafana"
assert_healthy "sj-alertmanager"
assert_healthy "sj-node-exporter"
assert_healthy "sj-cadvisor"
assert_healthy "sj-blackbox-exporter"
assert_healthy "sj-loki"
assert_healthy "sj-promtail"
assert_healthy "sj-otel-collector"
assert_healthy "sj-jaeger"

# 2. Database Read/Write validations
echo "Verifying PostgreSQL read/write operations..."
if [ -f "${INFRA_DIR}/.env" ]; then
  export $(grep -v '^#' "${INFRA_DIR}/.env" | xargs)
fi
DB_USER="${DB_USER:-sjcloud}"
DB_PASSWORD="${DB_PASSWORD:-sjcloudpassword}"
REDIS_PASSWORD="${REDIS_PASSWORD:-sjredispassword}"

PG_QUERY=$(docker exec -e PGPASSWORD="${DB_PASSWORD}" sj-postgres psql -U "${DB_USER}" -d sj_tenant_manager -t -A -c "SELECT 1;")
if [ "${PG_QUERY}" = "1" ]; then
  echo "  [PASS] PostgreSQL responsive and query verified."
else
  echo "  [FAIL] PostgreSQL query failed."
  FAILED=1
fi

echo "Verifying Redis operations..."
REDIS_PING=$(docker exec sj-redis redis-cli -a "${REDIS_PASSWORD}" ping)
if [ "${REDIS_PING}" = "PONG" ]; then
  echo "  [PASS] Redis responsive and authenticated."
else
  echo "  [FAIL] Redis ping failed: ${REDIS_PING}"
  FAILED=1
fi

# 3. MinIO Buckets layout validation
echo "Verifying MinIO bucket structures..."
if [ -f "${INFRA_DIR}/secrets/minio_root_user" ]; then
  MINIO_ROOT_USER=$(cat "${INFRA_DIR}/secrets/minio_root_user")
fi
if [ -f "${INFRA_DIR}/secrets/minio_root_password" ]; then
  MINIO_ROOT_PASSWORD=$(cat "${INFRA_DIR}/secrets/minio_root_password")
fi

check_bucket() {
  local bucket=$1
  if docker run --net sj-data --rm --entrypoint /bin/sh -e MC_CONFIG_DIR=/tmp/.mc minio/mc:latest -c \
    "mc alias set local http://minio:9000 \"${MINIO_ROOT_USER:-sjminio}\" \"${MINIO_ROOT_PASSWORD:-sjminiopassword}\" >/dev/null 2>&1 && mc ls local/${bucket}" >/dev/null 2>&1; then
    echo "  [PASS] MinIO bucket '${bucket}' exists."
  else
    echo "  [FAIL] MinIO bucket '${bucket}' missing."
    FAILED=1
  fi
}
check_bucket "backups"
check_bucket "artifacts"
check_bucket "releases"
check_bucket "tenant-storage"
check_bucket "logs"

# 4. Monitoring & Logging targets validation
echo "Verifying Prometheus metric scrapers..."
if docker exec sj-prometheus wget -q -O- http://localhost:9090/-/healthy >/dev/null 2>&1; then
  echo "  [PASS] Prometheus API endpoint is active."
else
  echo "  [FAIL] Prometheus API down."
  FAILED=1
fi

echo "Verifying Loki ingestion status..."
if docker exec sj-loki wget -q -O- http://localhost:3100/ready >/dev/null 2>&1; then
  echo "  [PASS] Loki ingestion database is active."
else
  echo "  [FAIL] Loki ingestion database down."
  FAILED=1
fi

# 5. Backup & Disaster Recovery tests
echo "Verifying Backup/Restore loop integrity..."
if bash "${INFRA_DIR}/scripts/verify-backup.sh"; then
  echo "  [PASS] Backup and Restore verification successfully completed."
else
  echo "  [FAIL] Backup and Restore verification failed."
  FAILED=1
fi

# 6. Container Hardening compliance check
echo "Verifying Container Hardening Compliance..."
if bash "${INFRA_DIR}/scripts/infrastructure-test.sh"; then
  echo "  [PASS] Container hardening checks passed."
else
  echo "  [FAIL] Container hardening checks failed."
  FAILED=1
fi

# 7. Secrets Validation
echo "Verifying Docker secrets files..."
required_secrets=(
  "postgres_password"
  "redis_password"
  "minio_root_user"
  "minio_root_password"
  "grafana_admin_password"
  "jwt_secret"
  "encryption_key"
)
secrets_ok=true
for secret in "${required_secrets[@]}"; do
  secret_file="${INFRA_DIR}/secrets/${secret}"
  if [ -f "${secret_file}" ] && [ -s "${secret_file}" ]; then
    :
  else
    echo "  [FAIL] Secret file '${secret}' is missing or empty."
    secrets_ok=false
    FAILED=1
  fi
done
if [ "${secrets_ok}" = "true" ]; then
  echo "  [PASS] All required Docker secret files are present and populated."
fi

# 8. TLS Certificates Validation
echo "Verifying SSL/TLS wildcard certificates..."
if bash "${INFRA_DIR}/scripts/verify-certificates.sh" >/dev/null 2>&1; then
  echo "  [PASS] TLS certificates structure, SAN domains, and expiration date are valid."
else
  echo "  [FAIL] TLS certificates validation failed."
  FAILED=1
fi

# 9. Platform Health Engine validation
echo "Verifying Platform Health Engine API..."
export NODE_PATH="platform/service-mesh/node_modules:node_modules"
PORT=8099 node platform/tenant-manager/api/tenant-api.js >/dev/null 2>&1 &
API_PID=$!
sleep 2

health_api_res=$(curl -s http://localhost:8099/admin/infrastructure/health || echo "offline")
kill -9 $API_PID || true

if [ "${health_api_res}" = "offline" ]; then
  echo "  [FAIL] Platform Health API is unreachable."
  FAILED=1
else
  health_status=$(echo "${health_api_res}" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "ERROR")
  health_score=$(echo "${health_api_res}" | grep -o '"score":[0-9]*' | cut -d':' -f2 || echo "0")
  if [ "${health_status}" = "GREEN" ] || [ "${health_status}" = "YELLOW" ]; then
    echo "  [PASS] Platform Health Engine is active (Score: ${health_score}, Status: ${health_status})."
  else
    echo "  [FAIL] Platform Health Engine status is ${health_status} (Score: ${health_score})."
    FAILED=1
  fi
fi

if [ $FAILED -eq 0 ]; then
  echo "=========================================="
  echo "All infrastructure tests passed successfully!"
  echo "=========================================="
  exit 0
else
  echo "=========================================="
  echo "Infrastructure tests FAILED!"
  echo "=========================================="
  exit 1
fi
