#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Proxy Timeout Validation ==="

# Helper to run curl inside billing container
exec_curl() {
  docker exec sj-billing curl -s "$1"
}

# Helper to query proxy metrics
get_timeout_metric() {
  docker exec sj-mesh-proxy curl -s http://localhost:9090/metrics | grep 'sj_mesh_timeouts_total{.*destination="auth".*}' | awk '{print $2}' || echo "0"
}

# 1. Get initial timeout metric
INITIAL_TIMEOUTS=$(get_timeout_metric)
echo "Initial timeouts count: ${INITIAL_TIMEOUTS}"

# 2. Trigger read timeout by hitting /delay?ms=6000.
# Auth read_ms is 5000ms, so this must timeout.
echo "Sending request with 6000ms delay (auth read limit is 5000ms)..."
HTTP_STATUS=$(docker exec sj-billing curl -s -o /dev/null -w "%{http_code}" "http://auth/delay?ms=6000" || echo "failed")
echo "Response status received: ${HTTP_STATUS}"

# 3. Check updated timeout metric
UPDATED_TIMEOUTS=$(get_timeout_metric)
echo "Updated timeouts count: ${UPDATED_TIMEOUTS}"

# Check status code is 504 (or failed due to proxy closing connection)
if [ "${HTTP_STATUS}" != "504" ]; then
  echo "❌ Error: Expected HTTP status 504 Gateway Timeout, got ${HTTP_STATUS}."
  exit 1
fi

echo "✅ Proxy Timeout Validation Passed."
exit 0
