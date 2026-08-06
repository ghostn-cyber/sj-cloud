#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "Checking Environment Sanity (Doctor Task)..."
echo "=========================================="

FAILED=0

# Helper assertion function
assert_binary() {
  local binary=$1
  if command -v "${binary}" >/dev/null 2>&1; then
    echo "  [OK]  Tool found: ${binary}"
  else
    echo "  [ERR] Tool missing: ${binary}"
    FAILED=1
  fi
}

assert_port_free() {
  local port=$1
  local name=$2
  if nc -z localhost "${port}" >/dev/null 2>&1; then
    echo "  [ERR] Port ${port} (${name}) is already in use by another process!"
    FAILED=1
  else
    echo "  [OK]  Port ${port} (${name}) is free."
  fi
}

# 1. Check binaries
echo "Verifying CLI tools dependencies..."
assert_binary "docker"
if docker compose version >/dev/null 2>&1; then
  echo "  [OK]  Tool found: docker compose"
else
  echo "  [ERR] Tool missing: docker compose"
  FAILED=1
fi
assert_binary "openssl"
assert_binary "curl"
assert_binary "git"
assert_binary "make"
assert_binary "tar"

# 2. Check Docker Daemon
echo "Verifying Docker daemon connectivity..."
if docker info >/dev/null 2>&1; then
  echo "  [OK]  Docker engine is active and responding."
else
  echo "  [ERR] Docker engine is inactive. Please start Docker."
  FAILED=1
fi

# 3. Check Host Port conflicts
echo "Verifying network port availability..."
assert_port_free 80 "HTTP Ingress Gateway"
assert_port_free 443 "HTTPS Ingress Gateway"

if [ $FAILED -eq 0 ]; then
  echo "=========================================="
  echo "All environment checks passed successfully!"
  echo "=========================================="
  exit 0
else
  echo "=========================================="
  echo "Environment check failed. Correct errors before deploying."
  echo "=========================================="
  exit 1
fi
