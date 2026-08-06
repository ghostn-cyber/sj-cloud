#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== Running CI/CD Configuration Validation ==="
export NODE_PATH="${SCRIPT_DIR}/../../platform/service-mesh/node_modules"
node "${SCRIPT_DIR}/validate-cicd.js"
