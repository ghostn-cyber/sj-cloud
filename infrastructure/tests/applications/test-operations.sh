#!/usr/bin/env bash
set -eo pipefail

echo "Running E2E Integration test for SRE Operations API..."

export NODE_PATH="platform/service-mesh/node_modules:node_modules"

PORT=8089 node platform/tenant-manager/api/tenant-api.js &
SERVER_PID=$!

sleep 1.5

cleanup() {
  echo "Cleaning up server process $SERVER_PID..."
  kill -9 $SERVER_PID || true
}
trap cleanup EXIT

echo "Testing /metrics..."
curl -s -f http://localhost:8089/metrics > /dev/null

echo "Testing GET /admin/dashboard..."
curl -s -f http://localhost:8089/admin/dashboard > /dev/null

echo "Testing GET /admin/diagnostics..."
curl -s -f http://localhost:8089/admin/diagnostics > /dev/null

echo "Testing GET /admin/alerts..."
curl -s -f http://localhost:8089/admin/alerts > /dev/null

echo "Testing GET /admin/incidents..."
curl -s -f http://localhost:8089/admin/incidents > /dev/null

echo "Testing GET /admin/health-score..."
curl -s -f http://localhost:8089/admin/health-score > /dev/null

echo "✅ SRE Operations API Integration E2E checks passed successfully!"
