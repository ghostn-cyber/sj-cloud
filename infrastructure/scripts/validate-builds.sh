#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Build Engine Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js build
echo "✅ Build Engine Validation Passed."
exit 0
