#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPTS_DIR}/../compose"

echo "=========================================="
echo "Cleaning Up SJ Cloud Local Stacks..."
echo "=========================================="

# List of stack compose files
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

# Shutdown containers and remove volumes
echo "Stopping all services and removing compose volumes..."
docker compose "${COMPOSE_ARGS[@]}" down -v --remove-orphans || true

# Purge named Docker volumes explicitly if any leftovers
echo "Wiping named volumes..."
docker volume rm sj-postgres-data sj-redis-data sj-minio-data sj-prometheus-data sj-grafana-data sj-loki-data 2>/dev/null || true

# Delete local certificate copies
echo "Removing certificates..."
rm -f "${SCRIPTS_DIR}/../certificates"/sj-cloud.test.*
rm -f "${SCRIPTS_DIR}/../traefik/certs"/sj-cloud.test.*

# Remove local backup archives
echo "Clearing backup archives..."
rm -f "${SCRIPTS_DIR}/../backups/archives"/*

echo "=========================================="
echo "Cleanup successfully completed!"
echo "=========================================="
