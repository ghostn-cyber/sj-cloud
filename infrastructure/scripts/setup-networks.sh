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

# 1. sj-edge
create_network "sj-edge" "172.20.0.0/24" "false" "External entry network. Receives traffic from host and connects only to Traefik proxy. Publishes ports 80 and 443."

# 2. sj-proxy
create_network "sj-proxy" "172.20.1.0/24" "true" "Reverse proxy routing network connecting Traefik, API Gateway, Dashboard, Docs, and Status. No databases or storage."

# 3. sj-services
create_network "sj-services" "172.20.2.0/24" "true" "Internal service network for Auth, Notifications, Queue, Search, Analytics, Audit, Storage API, and Tenant Applications."

# 4. sj-data
create_network "sj-data" "172.20.3.0/24" "true" "Private database and storage network for PostgreSQL, Redis, and MinIO. No public access or published ports."

# 5. sj-monitoring
create_network "sj-monitoring" "172.20.4.0/24" "true" "Observability network connecting Prometheus, Grafana, Loki, and AlertManager for metrics/log scraping."

# 6. sj-backup
create_network "sj-backup" "172.20.5.0/24" "true" "Isolated database and storage backup and restore network. No application or request traffic."

echo "=========================================="
echo "All networks successfully created!"
echo "=========================================="
docker network ls --filter label=platform=sj-cloud
