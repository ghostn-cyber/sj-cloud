#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Rollback Engine Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js rollback
echo "✅ Rollback Engine Validation Passed."
exit 0
