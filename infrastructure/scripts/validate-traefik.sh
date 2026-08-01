#!/usr/bin/env bash
set -euo pipefail

# Runtime Validation Script for Traefik Ingress Gateway
# Executes checks against the running containers.

PROJECT_ROOT="/home/bokeh/Projects/sj-cloud"
TESTS_DIR="${PROJECT_ROOT}/infrastructure/tests"

echo "=========================================="
echo "Running Runtime Ingress Validation..."
echo "=========================================="

# 1. Run compliance tests
bash "${TESTS_DIR}/architecture/compliance.sh"

# 2. Run network isolation checks
bash "${TESTS_DIR}/network/isolation.sh"

# 3. Run security and dashboard validations
bash "${TESTS_DIR}/security/dashboard.sh"

# 4. Run routing rules tests
bash "${TESTS_DIR}/routing/rules.sh"

echo "=========================================="
echo "Runtime ingress validation successful!"
echo "=========================================="
