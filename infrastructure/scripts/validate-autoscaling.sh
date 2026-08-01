#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Autoscaling Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js autoscaling
echo "✅ Autoscaling Validation Passed."
exit 0
