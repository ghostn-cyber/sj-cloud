#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Proxy Observability Validation ==="

# Helper to run curl inside billing container
exec_curl() {
  docker exec sj-billing curl -s "$@"
}

# 1. Verify Traceparent context header propagation
TEST_TRACE_ID="1234567890abcdef1234567890abcdef"
TEST_SPAN_ID="abcdef0123456789"
TEST_HEADER="00-${TEST_TRACE_ID}-${TEST_SPAN_ID}-01"

echo "Sending request to http://auth/echo with traceparent header: ${TEST_HEADER}"

RESPONSE=$(exec_curl -H "traceparent: ${TEST_HEADER}" "http://auth/echo")

echo "Received Response:"
echo "${RESPONSE}"

# Assert traceparent exists in backend headers and traceId matches
PROPAGATED_HEADER=$(echo "${RESPONSE}" | grep -i 'traceparent' | awk -F'"' '{print $4}' || true)
echo "Propagated Traceparent Header: ${PROPAGATED_HEADER}"

if [ -z "${PROPAGATED_HEADER}" ]; then
  echo "❌ Error: Propagated traceparent header not found in echo response."
  exit 1
fi

# Split propagated header
IFS='-' read -r -a parts <<< "${PROPAGATED_HEADER}"
PROPAGATED_TRACE_ID="${parts[1]}"
PROPAGATED_SPAN_ID="${parts[2]}"

echo "Propagated Trace ID: ${PROPAGATED_TRACE_ID}"
echo "Propagated Span ID : ${PROPAGATED_SPAN_ID}"

if [ "${PROPAGATED_TRACE_ID}" != "${TEST_TRACE_ID}" ]; then
  echo "❌ Error: Trace ID was not propagated. Expected ${TEST_TRACE_ID}, got ${PROPAGATED_TRACE_ID}"
  exit 1
fi

if [ "${PROPAGATED_SPAN_ID}" == "${TEST_SPAN_ID}" ]; then
  echo "❌ Error: Span ID was not rotated. Got identical Span ID ${TEST_SPAN_ID}."
  exit 1
fi

# 2. Verify Prometheus Metrics Scraping
echo "Verifying Prometheus Metrics on port 9090..."
METRICS=$(docker exec sj-mesh-proxy curl -s http://localhost:9090/metrics)

if [[ "${METRICS}" != *"sj_mesh_requests_total"* ]]; then
  echo "❌ Error: Prometheus metrics are missing sj_mesh_requests_total."
  exit 1
fi

echo "✅ Proxy Observability Validation Passed."
exit 0
