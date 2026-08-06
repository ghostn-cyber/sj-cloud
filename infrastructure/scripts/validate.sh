#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPTS_DIR}/../compose"

COMPOSE_ARGS=(
  -f "${COMPOSE_DIR}/00-core.yml"
  -f "${COMPOSE_DIR}/10-platform.yml"
  -f "${COMPOSE_DIR}/20-mesh.yml"
  -f "${COMPOSE_DIR}/30-storage.yml"
  -f "${COMPOSE_DIR}/40-monitoring.yml"
  -f "${COMPOSE_DIR}/50-observability.yml"
  -f "${COMPOSE_DIR}/60-development.yml"
  -f "${COMPOSE_DIR}/70-tools.yml"
)

echo "=========================================="
echo "Validating Infrastructure Configurations..."
echo "=========================================="

# 1. Validate Docker Compose config file integrity
echo "Validating Docker Compose merge specification..."
docker compose "${COMPOSE_ARGS[@]}" config > /dev/null

# 2. Check Traefik files
echo "Checking Traefik configuration files..."
if [ -f "${SCRIPTS_DIR}/../traefik/traefik.yml" ]; then
  echo "  [OK] traefik.yml static config exists."
else
  echo "  [ERR] traefik.yml config missing."
  exit 1
fi

echo "All static configurations are valid!"
echo "=========================================="
