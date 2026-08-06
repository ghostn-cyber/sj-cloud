#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPTS_DIR}/.."

echo "=========================================="
echo "Rotating SSL/TLS Certificates..."
echo "=========================================="

# Run generator script to overwrite active cert files
bash "${SCRIPTS_DIR}/generate-certificates.sh"

# Touch dynamic TLS config to force Traefik to reload certificates
touch "${INFRA_DIR}/traefik/dynamic/tls-certificates.yml"

echo "Traefik notified of certificate rotation."
echo "Rotation successfully completed!"
echo "=========================================="
