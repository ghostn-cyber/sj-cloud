#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Release Manager Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js releases
echo "✅ Release Manager Validation Passed."
exit 0
