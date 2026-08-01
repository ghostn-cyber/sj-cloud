#!/usr/bin/env bash
set -euo pipefail

# Ingress Routing Rules Compliance Tests

echo "=========================================="
echo "Running Ingress Routing Rules Tests..."
echo "=========================================="

# 1. Test Traefik health check ping endpoint (/ping) on HTTP port 80
echo "Testing /ping health check..."
STATUS_PING=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ping)
if [ "${STATUS_PING}" != "200" ]; then
  echo "❌ Error: Ping health endpoint returned status ${STATUS_PING}!"
  exit 1
fi
echo "✅ Ping health endpoint responded with 200 OK."

# 2. Test HTTP -> HTTPS redirection
echo "Testing HTTP to HTTPS redirect..."
REDIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: platform.test" http://127.0.0.1/)
if [ "${REDIRECT_STATUS}" != "301" ]; then
  echo "❌ Error: HTTP to HTTPS redirection did not occur! (Status: ${REDIRECT_STATUS})"
  exit 1
fi

REDIRECT_URL=$(curl -s -I -H "Host: platform.test" http://127.0.0.1/ | grep -i "location:" | tr -d '\r\n')
if [[ ! "${REDIRECT_URL}" =~ "https://platform.test/" ]]; then
  echo "❌ Error: Redirect URL was invalid: ${REDIRECT_URL}"
  exit 1
fi
echo "✅ HTTP request redirected to HTTPS successfully (${REDIRECT_URL})."

# 3. Test Prometheus metrics endpoint (/metrics)
echo "Testing /metrics telemetry endpoint..."
STATUS_METRICS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/metrics)
if [ "${STATUS_METRICS}" != "200" ]; then
  echo "❌ Error: Metrics telemetry endpoint returned status ${STATUS_METRICS}!"
  exit 1
fi
echo "✅ Prometheus metrics endpoint responded with 200 OK."

echo "=========================================="
echo "Ingress routing rules tests passed!"
echo "=========================================="
