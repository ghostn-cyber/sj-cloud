#!/usr/bin/env bash
set -euo pipefail

# Architectural Compliance Tests for Traefik Ingress

echo "=========================================="
echo "Running Architectural Compliance Tests..."
echo "=========================================="

CONTAINER_NAME="sj-traefik"
PROXY_NAME="sj-docker-socket-proxy"

# 1. Verify containers are running
for container in "${CONTAINER_NAME}" "${PROXY_NAME}"; do
  if ! docker inspect "${container}" >/dev/null 2>&1; then
    echo "❌ Error: Container ${container} is not running!"
    exit 1
  fi
  RUNNING=$(docker inspect "${container}" --format '{{.State.Running}}')
  if [ "${RUNNING}" != "true" ]; then
    echo "❌ Error: Container ${container} is present but not running!"
    exit 1
  fi
  echo "✅ Container ${container} is running."
done

# 2. Verify Docker Socket is NOT directly mounted to Traefik (Zero-Trust)
MOUNTS=$(docker inspect "${CONTAINER_NAME}" --format '{{range .Mounts}}{{.Destination}} {{end}}')
if [[ "${MOUNTS}" =~ "/var/run/docker.sock" ]]; then
  echo "❌ Error: Raw host Docker socket is exposed directly to Traefik!"
  exit 1
fi
echo "✅ Raw Docker socket is isolated from Traefik container."

# 3. Verify Docker Socket is mounted read-only to the socket proxy
READ_ONLY_SOCKET=$(docker inspect "${PROXY_NAME}" --format '{{range .Mounts}}{{if eq .Destination "/var/run/docker.sock"}}{{not .RW}}{{end}}{{end}}')
if [ "${READ_ONLY_SOCKET}" != "true" ]; then
  echo "❌ Error: Docker socket is NOT mounted read-only to proxy!"
  exit 1
fi
echo "✅ Docker socket is mounted read-only to the translation proxy."

# 4. Verify security_opt (no-new-privileges) is enabled on Traefik
SEC_OPTS=$(docker inspect "${CONTAINER_NAME}" --format '{{.HostConfig.SecurityOpt}}')
if [[ ! "${SEC_OPTS}" =~ "no-new-privileges" ]]; then
  echo "❌ Error: no-new-privileges is NOT set on Traefik container!"
  exit 1
fi
echo "✅ Traefik container is running with no-new-privileges security option."

# 5. Verify published ingress entrypoint ports
PORT_COUNT=$(docker inspect "${CONTAINER_NAME}" --format '{{range $k, $v := .NetworkSettings.Ports}}{{$k}} {{end}}' | wc -w)
if [ "${PORT_COUNT}" -ne 2 ]; then
  echo "❌ Error: Container publishes unexpected ports! (Total: ${PORT_COUNT})"
  exit 1
fi
echo "✅ Ingress container publishes exactly the defined entrypoint ports."

# 6. Verify api.insecure is false
echo "Checking if api.insecure is disabled..."
STATIC_CONFIG_INSECURE=$(docker exec "${CONTAINER_NAME}" cat /etc/traefik/traefik.yml | grep -E "insecure[[:space:]]*:[[:space:]]*true" || true)
if [ ! -z "${STATIC_CONFIG_INSECURE}" ]; then
  echo "❌ Error: api.insecure=true is enabled in traefik.yml!"
  exit 1
fi
echo "✅ Static api.insecure is disabled (api.insecure=false)."

# 7. Verify dynamic configurations loaded via Traefik API
echo "Verifying Traefik dynamic configuration via internal API..."
RAWDATA=$(curl -k -s -u "admin:sjcloudadmin" --resolve "dashboard.platform.test:443:127.0.0.1" https://dashboard.platform.test/api/rawdata)

# Assert dashboard router is enabled and uses basic auth middleware
DASHBOARD_ROUTER_STATUS=$(echo "${RAWDATA}" | jq -r '.routers["dashboard@file"].status // empty')
if [ "${DASHBOARD_ROUTER_STATUS}" != "enabled" ]; then
  echo "❌ Error: dashboard router is NOT active!"
  exit 1
fi

DASHBOARD_MIDDLEWARES=$(echo "${RAWDATA}" | jq -r '.routers["dashboard@file"].middlewares[] // empty')
if [[ ! "${DASHBOARD_MIDDLEWARES}" =~ "dashboard-auth@file" ]]; then
  echo "❌ Error: dashboard router does NOT have dashboard-auth middleware attached!"
  exit 1
fi
echo "✅ Dashboard router is enabled and protected by dashboard-auth middleware."

# Assert key middlewares are loaded
for mw in "dashboard-auth@file" "security-headers@file" "global-rate-limit@file"; do
  MW_STATUS=$(echo "${RAWDATA}" | jq -r ".middlewares[\"${mw}\"].status // empty")
  if [ "${MW_STATUS}" != "enabled" ]; then
    echo "❌ Error: Middleware ${mw} is not loaded/enabled!"
    exit 1
  fi
done
echo "✅ All architectural middlewares (auth, headers, rate-limiting) are active."

echo "=========================================="
echo "Architectural compliance tests passed!"
echo "=========================================="
