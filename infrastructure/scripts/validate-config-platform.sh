#!/usr/bin/env bash
set -euo pipefail

# Platform Configuration Validation Script
# Runs unit and E2E assertions for the centralized configuration abstraction layer.

PROJECT_ROOT="/home/bokeh/Projects/sj-cloud"

echo "============================================="
echo "Running Platform Configuration Validation..."
echo "============================================="

if ! node "${PROJECT_ROOT}/infrastructure/tests/validation/config-validation.js"; then
  echo "❌ Error: Platform configuration validation failed!"
  exit 1
fi

echo "============================================="
echo "Platform configuration validation successful!"
echo "============================================="
