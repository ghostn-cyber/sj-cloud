#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Proxy Routing Validation ==="

# Helper to run curl inside billing container
exec_curl() {
  docker exec sj-billing curl -s "$1"
}

# 1. Execute request to http://auth/echo via mesh-proxy interception
echo "Sending routing test request to http://auth/echo..."
RESPONSE=$(exec_curl "http://auth/echo")

echo "Routing Response:"
echo "${RESPONSE}"

# 2. Verify response matches expected mock backend values
MOCK_SERVICE=$(echo "${RESPONSE}" | grep '"service":' | awk -F'"' '{print $4}' || true)
if [ "${MOCK_SERVICE}" != "auth" ]; then
  echo "❌ Error: Routing failed. Response did not originate from auth mock. Got: ${MOCK_SERVICE}"
  exit 1
fi

echo "✅ Proxy Routing Validation Passed."
exit 0
