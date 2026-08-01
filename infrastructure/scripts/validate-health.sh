#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Control Plane Health Validation ==="

# Helper function to run curl inside the sj-billing container
exec_curl() {
  docker exec sj-billing curl -s "$1"
}

# 1. Verify Registry API health endpoint
HEALTH_RESP=$(exec_curl "http://registry-api:8080/health")
echo "Registry API Health: ${HEALTH_RESP}"
if [[ "${HEALTH_RESP}" != *"UP"* ]]; then
  echo "❌ Error: Registry API health check failed."
  exit 1
fi

# 2. Verify Registry API services endpoint returns 10 services
SERVICES_LIST=$(exec_curl "http://registry-api:8080/services")
SERVICES_COUNT=$(echo "${SERVICES_LIST}" | grep -c '"id":' || true)
echo "Registered services count: ${SERVICES_COUNT}"
if [ "${SERVICES_COUNT}" -ne 10 ]; then
  echo "❌ Error: Expected 10 registered services, got ${SERVICES_COUNT}."
  exit 1
fi

# 3. Test active health monitoring transitions
echo "Testing health state transitions..."

# Initial check: auth should be healthy
AUTH_STATUS=$(exec_curl "http://registry-api:8080/services/auth" | grep '"status":' | awk -F'"' '{print $4}' || true)
echo "Initial Auth status: ${AUTH_STATUS}"

# Trigger auth mock service to report UNREADY
echo "Triggering Auth readiness probe failure..."
exec_curl "http://sj-auth:80/trigger/ready?enable=false" > /dev/null

# Wait for health monitor check interval (default 5s)
echo "Waiting 6 seconds for health monitor sweep..."
sleep 6

# Verify status transitioned to 'Starting'
NEW_STATUS=$(exec_curl "http://registry-api:8080/services/auth" | grep '"status":' | awk -F'"' '{print $4}' || true)
echo "Updated Auth status: ${NEW_STATUS}"

# Reset Auth readiness probe
exec_curl "http://sj-auth:80/trigger/ready?enable=true" > /dev/null

if [ "${NEW_STATUS}" != "Starting" ] && [ "${NEW_STATUS}" != "Unhealthy" ]; then
  echo "❌ Error: Health monitor did not detect readiness transition. Expected 'Starting' or 'Unhealthy', got '${NEW_STATUS}'."
  exit 1
fi

echo "=== Running Application Health Manager Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js health

echo "✅ Health Monitoring Validation Passed."
exit 0
