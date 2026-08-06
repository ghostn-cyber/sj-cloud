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
echo "Updating SJ Cloud Infrastructure..."
echo "=========================================="

echo "Pulling fresh container images..."
docker compose "${COMPOSE_ARGS[@]}" pull

echo "Applying rolling update on compose stacks..."
docker compose "${COMPOSE_ARGS[@]}" up -d --remove-orphans

echo "Update process successfully completed!"
echo "=========================================="
