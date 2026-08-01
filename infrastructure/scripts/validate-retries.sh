#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Proxy Retry Validation ==="

# Helper to run curl inside billing container
exec_curl() {
  docker exec sj-billing curl -s "$1"
}

# Helper to query proxy metrics
get_retry_metric() {
  docker exec sj-mesh-proxy curl -s http://localhost:9090/metrics | grep 'sj_mesh_retries_total{.*destination="auth".*}' | awk '{print $2}' || echo "0"
}

# 1. Get initial retry metric count
INITIAL_RETRIES=$(get_retry_metric)
echo "Initial retries count: ${INITIAL_RETRIES}"

# 2. Trigger a 500 error request. Auth is configured with max_attempts: 3.
# GET is idempotent, so it is automatically retried.
echo "Sending request that returns 500 status code..."
RESPONSE_STATUS=$(docker exec sj-billing curl -s -o /dev/null -w "%{http_code}" "http://auth/status?code=500")
echo "Response status received: ${RESPONSE_STATUS}"

# 3. Check updated retry metric count
UPDATED_RETRIES=$(get_retry_metric)
echo "Updated retries count: ${UPDATED_RETRIES}"

DIFFERENCE=$((UPDATED_RETRIES - INITIAL_RETRIES))
echo "Retry attempts made: ${DIFFERENCE}"

if [ "${DIFFERENCE}" -lt 2 ]; then
  echo "❌ Error: Expected at least 2 retry attempts, got ${DIFFERENCE}."
  exit 1
fi

echo "✅ Proxy Retry Validation Passed."
exit 0
