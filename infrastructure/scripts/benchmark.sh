#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPTS_DIR}/.."

# Load environment vars if available
if [ -f "${INFRA_DIR}/.env" ]; then
  export $(grep -v '^#' "${INFRA_DIR}/.env" | xargs)
fi

DB_USER="${DB_USER:-sjcloud}"
DB_PASSWORD="${DB_PASSWORD:-06f403e6eea13a7df3839baadb0a9a1e12f97d37cc95d8af}"
REDIS_PASSWORD="${REDIS_PASSWORD:-20eb9657464675248232a050d19d51058e7470a0e0ba5917}"

echo "=========================================="
echo "Starting SJ Cloud Infrastructure Benchmark..."
echo "=========================================="

# Helper function to get duration in milliseconds
get_duration_ms() {
  local start=$1
  local end=$2
  # Compatible with bash/bc if available, otherwise do basic math
  local diff=$((end - start))
  echo "$((diff / 1000000))"
}

# 1. Container Startup Latency
echo "Benchmarking Container Startup Latency..."
start_time=$(date +%s%N)
docker run --rm --network=none alpine:latest echo -n "" >/dev/null
end_time=$(date +%s%N)
startup_ms=$(get_duration_ms "${start_time}" "${end_time}")
echo "  - Test Container Startup: ${startup_ms} ms"

# 2. Database Latencies
echo "Benchmarking Database Latencies..."

# PostgreSQL
if docker exec sj-postgres pg_isready >/dev/null 2>&1; then
  start_time=$(date +%s%N)
  # Run a SELECT 1 query
  docker exec -e PGPASSWORD="${DB_PASSWORD}" sj-postgres psql -U "${DB_USER}" -d postgres -c "SELECT 1;" >/dev/null 2>&1
  end_time=$(date +%s%N)
  pg_ms=$(get_duration_ms "${start_time}" "${end_time}")
  echo "  - PostgreSQL Query Latency: ${pg_ms} ms"
else
  echo "  - PostgreSQL Query Latency: OFFLINE"
fi

# Redis
if docker exec sj-redis redis-cli -a "${REDIS_PASSWORD}" ping >/dev/null 2>&1; then
  start_time=$(date +%s%N)
  docker exec sj-redis redis-cli -a "${REDIS_PASSWORD}" ping >/dev/null 2>&1
  end_time=$(date +%s%N)
  redis_ms=$(get_duration_ms "${start_time}" "${end_time}")
  echo "  - Redis PING Latency: ${redis_ms} ms"
else
  echo "  - Redis PING Latency: OFFLINE"
fi

# 3. MinIO Throughput
echo "Benchmarking MinIO Throughput..."
if docker exec sj-minio curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; then
  # Create a 1MB test file
  dd if=/dev/urandom of=/tmp/sj-bench-1mb bs=1024 count=1000 status=none
  
  # Measure Upload
  start_time=$(date +%s%N)
  docker run --rm --entrypoint sh --network sj-data \
    -v /tmp:/tmp \
    -v "${INFRA_DIR}/secrets:/run/secrets:ro" \
    -e MC_CONFIG_DIR=/tmp/.mc \
    minio/mc -c "
      mc alias set local http://minio:9000 \$(cat /run/secrets/minio_root_user) \$(cat /run/secrets/minio_root_password) >/dev/null 2>&1
      mc cp /tmp/sj-bench-1mb local/backups/sj-bench-1mb >/dev/null 2>&1
    "
  end_time=$(date +%s%N)
  upload_ms=$(get_duration_ms "${start_time}" "${end_time}")
  
  # Measure Download
  start_time=$(date +%s%N)
  docker run --rm --entrypoint sh --network sj-data \
    -v /tmp:/tmp \
    -v "${INFRA_DIR}/secrets:/run/secrets:ro" \
    -e MC_CONFIG_DIR=/tmp/.mc \
    minio/mc -c "
      mc alias set local http://minio:9000 \$(cat /run/secrets/minio_root_user) \$(cat /run/secrets/minio_root_password) >/dev/null 2>&1
      mc cp local/backups/sj-bench-1mb /tmp/sj-bench-dl >/dev/null 2>&1
    "
  end_time=$(date +%s%N)
  download_ms=$(get_duration_ms "${start_time}" "${end_time}")

  # Cleanup
  rm -f /tmp/sj-bench-1mb /tmp/sj-bench-dl 2>/dev/null || true
  docker run --rm --entrypoint sh --network sj-data \
    -v "${INFRA_DIR}/secrets:/run/secrets:ro" \
    -e MC_CONFIG_DIR=/tmp/.mc \
    minio/mc -c "
      mc alias set local http://minio:9000 \$(cat /run/secrets/minio_root_user) \$(cat /run/secrets/minio_root_password) >/dev/null 2>&1
      mc rm local/backups/sj-bench-1mb >/dev/null 2>&1
    " >/dev/null 2>&1

  echo "  - MinIO 1MB Upload:   ${upload_ms} ms"
  echo "  - MinIO 1MB Download: ${download_ms} ms"
else
  echo "  - MinIO Storage: OFFLINE"
fi

# 4. Traefik Routing Latency
echo "Benchmarking Ingress Routing Latency..."
# Check if Traefik is reachable locally
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health >/dev/null 2>&1 || true; then
  start_time=$(date +%s%N)
  curl_status=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: sj-cloud.test" http://localhost:80/health || true)
  end_time=$(date +%s%N)
  routing_ms=$(get_duration_ms "${start_time}" "${end_time}")
  echo "  - Traefik Routing Latency: ${routing_ms} ms (HTTP Status: ${curl_status})"
else
  echo "  - Traefik Ingress: OFFLINE"
fi

echo "=========================================="
echo "Benchmark successfully completed!"
echo "=========================================="
