#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Deployment Engine Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js deployment
echo "✅ Deployment Engine Validation Passed."
exit 0
