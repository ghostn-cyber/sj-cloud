#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../" && pwd)"

echo "=== Running Discovery Test: DNS Resolution ==="
bash "${PROJECT_ROOT}/infrastructure/scripts/validate-discovery.sh"
