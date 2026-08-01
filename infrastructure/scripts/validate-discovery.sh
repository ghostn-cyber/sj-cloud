#!/usr/bin/env bash
set -euo pipefail

echo "=== Running DNS Discovery Validation ==="

# Helper function to get container IP on the sj-services network
get_container_ip() {
  docker inspect -f '{{(index .NetworkSettings.Networks "sj-services").IPAddress}}' "$1" 2>/dev/null || true
}

# 1. Get proxy IP address
PROXY_IP=$(get_container_ip "sj-mesh-proxy")
if [ -z "${PROXY_IP}" ]; then
  echo "❌ Error: sj-mesh-proxy container is not running."
  exit 1
fi
echo "Service Mesh Proxy IP on sj-services: ${PROXY_IP}"

# 2. Assert DNS resolution of all services resolves to the Proxy IP
SERVICES=("auth" "storage" "notification" "analytics" "audit" "search" "queue" "tenant-manager" "billing")
FAILED=0

for service in "${SERVICES[@]}"; do
  # Resolve IP using getent or ping inside the billing container (which is on the sj-services network)
  RESOLVED_IP=$(docker exec sj-billing getent hosts "${service}" | awk '{print $1}' || true)
  
  if [ -z "${RESOLVED_IP}" ]; then
    # Fallback: check if ping works to resolve it
    RESOLVED_IP=$(docker exec sj-billing ping -c 1 -W 1 "${service}" 2>/dev/null | head -n 1 | awk -F'[()]' '{print $2}' || true)
  fi

  if [ "${RESOLVED_IP}" == "${PROXY_IP}" ]; then
    echo "✅ DNS Resolution: ${service} -> ${RESOLVED_IP} (Mesh Proxy IP)"
  else
    echo "❌ DNS Resolution Error: ${service} resolved to ${RESOLVED_IP:-nothing}, expected ${PROXY_IP}"
    FAILED=1
  fi
done

if [ "${FAILED}" -ne 0 ]; then
  echo "❌ DNS Discovery Validation FAILED"
  exit 1
fi

echo "✅ DNS Discovery Validation Passed."
exit 0
