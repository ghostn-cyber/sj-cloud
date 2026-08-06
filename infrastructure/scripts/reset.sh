#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Resetting SJ Cloud Infrastructure..."
echo "=========================================="

# 1. Cleanup
"${SCRIPTS_DIR}/cleanup.sh"

# 2. Bootstrap
"${SCRIPTS_DIR}/bootstrap.sh"

# 3. Spin up again
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

echo "Spinning up all Docker Compose stacks..."
docker compose "${COMPOSE_ARGS[@]}" up -d --build

echo "=========================================="
echo "Reset successfully completed!"
echo "=========================================="
