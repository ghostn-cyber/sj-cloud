#!/usr/bin/env bash
set -euo pipefail

# Script to provision SJ Cloud Docker networks matching compose specification

echo "=========================================="
echo "Creating SJ Cloud Docker Networks..."
echo "=========================================="

# Create network helper function
create_network() {
  local name=$1
  local subnet=$2
  local internal=$3
  local desc=$4

  echo "Creating network: ${name} (Subnet: ${subnet}, Internal: ${internal})..."
  
  # Check if network already exists to prevent conflict
  if docker network inspect "${name}" >/dev/null 2>&1; then
    echo "  Network ${name} already exists. Skipping creation."
    return 0
  fi

  local cmd=(
    docker network create
    --driver bridge
    --subnet "${subnet}"
    --label platform=sj-cloud
    --label layer=network
    --label environment=local
    --label managed-by=docker-compose
    --label description="${desc}"
    --attachable
  )

  if [ "${internal}" = "true" ]; then
    cmd+=(--internal)
  fi

  cmd+=("${name}")

  "${cmd[@]}"
}

# Cleanup old networks if they exist
echo "Cleaning up old/deprecated networks..."
for net in sj-proxy sj-services sj-data sj-monitoring sj-backup sj-ingress sj-control-plane sj-runtime sj-storage sj-observability sj-build sj-ci; do
  if docker network inspect "$net" >/dev/null 2>&1; then
    echo "Removing network $net..."
    docker network rm "$net" || true
  fi
done

# Create the 10 networks according to the zero-trust architecture
create_network "sj-edge" "172.20.0.0/24" "false" "Edge ingress network"
create_network "sj-proxy" "172.20.1.0/24" "true" "Private ingress proxy network"
create_network "sj-control-plane" "172.20.2.0/24" "true" "Control plane network"
create_network "sj-services" "172.20.3.0/24" "true" "Internal microservices runtime network"
create_network "sj-data" "172.20.4.0/24" "true" "Private storage network (Postgres, Redis, MinIO)"
create_network "sj-monitoring" "172.20.5.0/24" "true" "Internal metrics scraping network"
create_network "sj-observability" "172.20.6.0/24" "true" "Internal logs and tracing network"
create_network "sj-backup" "172.20.7.0/24" "true" "Isolated backup/restore network"
create_network "sj-build" "172.20.8.0/24" "true" "Build pipeline network"
create_network "sj-ci" "172.20.9.0/24" "true" "Continuous integration sandbox network"

echo "=========================================="
echo "All networks successfully created!"
echo "=========================================="
docker network ls --filter label=platform=sj-cloud
