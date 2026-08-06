#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPTS_DIR}/.."

echo "=========================================="
echo "Starting SJ Cloud Infrastructure Bootstrap..."
echo "=========================================="

# 1. Run Secrets Bootstrap
"${INFRA_DIR}/secrets/bootstrap.sh"

# 2. Setup networks
"${SCRIPTS_DIR}/setup-networks.sh"

# 3. Generate TLS Wildcard certificates
bash "${SCRIPTS_DIR}/generate-certificates.sh"

echo "=========================================="
echo "Infrastructure Bootstrap successfully completed!"
echo "=========================================="
