#!/usr/bin/env bash
set -eo pipefail

echo "=================================================================="
echo "SRE Operations & Platform Observability Validation runner"
echo "=================================================================="

export NODE_PATH="platform/service-mesh/node_modules:node_modules"

node infrastructure/tests/validation/operations-validation.js

echo "=================================================================="
echo "Validation Successful!"
echo "=================================================================="
