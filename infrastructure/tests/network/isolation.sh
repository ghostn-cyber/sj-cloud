#!/usr/bin/env bash
set -euo pipefail

# Network Isolation Compliance Tests for Traefik Ingress

echo "=========================================="
echo "Running Network Isolation Compliance Tests..."
echo "=========================================="

CONTAINER_NAME="sj-traefik"

# 1. Get all attached network names
NETWORKS=$(docker inspect "${CONTAINER_NAME}" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}')

echo "Attached networks: ${NETWORKS}"

# Count networks
NET_COUNT=$(echo "${NETWORKS}" | wc -w)
if [ "${NET_COUNT}" -ne 2 ]; then
  echo "❌ Error: Traefik is attached to ${NET_COUNT} networks! Expected exactly 2."
  exit 1
fi

# Check for sj-edge and sj-proxy presence
for net in sj-edge sj-proxy; do
  if [[ ! "${NETWORKS}" =~ "${net}" ]]; then
    echo "❌ Error: Network ${net} is NOT attached to the container!"
    exit 1
  fi
done
echo "✅ Traefik is connected ONLY to sj-edge and sj-proxy."

# 2. Verify subnets on the container networks
EDGE_IP=$(docker inspect "${CONTAINER_NAME}" --format '{{(index .NetworkSettings.Networks "sj-edge").IPAddress}}')
PROXY_IP=$(docker inspect "${CONTAINER_NAME}" --format '{{(index .NetworkSettings.Networks "sj-proxy").IPAddress}}')

echo "sj-edge IP: ${EDGE_IP}"
echo "sj-proxy IP: ${PROXY_IP}"

if [[ ! "${EDGE_IP}" =~ ^172\.20\.0\. ]]; then
  echo "❌ Error: sj-edge IP is not in the correct subnet (172.20.0.0/24)!"
  exit 1
fi
if [[ ! "${PROXY_IP}" =~ ^172\.20\.1\. ]]; then
  echo "❌ Error: sj-proxy IP is not in the correct subnet (172.20.1.0/24)!"
  exit 1
fi
echo "✅ IPs are correctly bound to designated architectural subnets."

# 3. Explicitly verify Traefik is NOT attached to other architectural networks
for banned in sj-services sj-data sj-monitoring sj-backup; do
  if [[ "${NETWORKS}" =~ "${banned}" ]]; then
    echo "❌ Error: Traefik is attached to unauthorized network ${banned}!"
    exit 1
  fi
done
echo "✅ Traefik is verified isolated from sj-services, sj-data, sj-monitoring, and sj-backup networks."

echo "=========================================="
echo "Network isolation compliance tests passed!"
echo "=========================================="
