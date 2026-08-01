#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Application Registry Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js registry
echo "✅ Application Registry Validation Passed."
exit 0
