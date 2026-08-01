#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Runtime Manager Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js runtime
echo "✅ Runtime Manager Validation Passed."
exit 0
