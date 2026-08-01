#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Image Validation ==="
NODE_PATH=platform/service-mesh/node_modules node infrastructure/tests/applications/application-validation.js images
echo "✅ Image Validation Passed."
exit 0
