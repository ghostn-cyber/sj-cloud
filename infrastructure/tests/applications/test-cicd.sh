#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Developer Platform & CI/CD Engine Integration Tests ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/validation/cicd-validation.js
echo "✅ CI/CD Integration Tests Passed."
exit 0
