#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Circuit Breaker Validation ==="

# Helper to run curl inside billing container and print HTTP status code and custom header
exec_curl_info() {
  local resp
  resp=$(docker exec sj-billing curl -s -i "$1" || true)
  local status
  status=$(echo "${resp}" | head -n 1 | awk '{print $2}' || true)
  local cb_header
  cb_header=$(echo "${resp}" | tr -d '\r' | grep -i '^x-circuit-breaker:' | awk '{print $2}' || true)
  echo "${status}:${cb_header}"
}

# 1. Force 5 failures. Auth circuit breaker has failure_threshold: 5.
# Send requests that return 500.
echo "Tripping the circuit breaker by sending 5 failed requests..."
for i in {1..5}; do
  INFO=$(exec_curl_info "http://auth/status?code=500")
  echo "Request ${i}: Response (status:cb_header) -> ${INFO}"
  # Wait briefly to let states propagate
  sleep 0.2
done

# 2. The 6th request should fail fast with 503 and X-Circuit-Breaker: Open
echo "Sending 6th request to verify fast-fail..."
INFO=$(exec_curl_info "http://auth/echo")
echo "6th Request: Response (status:cb_header) -> ${INFO}"

STATUS=$(echo "${INFO}" | cut -d':' -f1)
CB_HEADER=$(echo "${INFO}" | cut -d':' -f2)

if [ "${STATUS}" != "503" ] || [ "${CB_HEADER}" != "Open" ]; then
  echo "❌ Error: Expected HTTP status 503 and X-Circuit-Breaker: Open, got status ${STATUS} and header ${CB_HEADER}."
  exit 1
fi

echo "✅ Circuit Breaker Validation Passed."
exit 0
