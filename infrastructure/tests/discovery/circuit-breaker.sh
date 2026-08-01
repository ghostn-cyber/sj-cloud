#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../" && pwd)"

echo "=== Running Discovery Test: Circuit Breaker ==="
bash "${PROJECT_ROOT}/infrastructure/scripts/validate-circuit-breakers.sh"
