#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPTS_DIR}/../compose"

echo "=========================================="
echo "SJ Cloud Diagnostics & Cluster Status"
echo "=========================================="

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

echo "--- Services List ---"
docker compose "${COMPOSE_ARGS[@]}" ps

echo ""
echo "--- Resources Stats (CPU / Memory) ---"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"

echo ""
echo "--- Docker Network list ---"
docker network ls --filter label=platform=sj-cloud

echo "=========================================="
echo "Diagnostics collection complete!"
echo "=========================================="
