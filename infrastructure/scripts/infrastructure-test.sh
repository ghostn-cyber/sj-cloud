#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Infrastructure Hardening Tests ==="
docker ps --format '{{.Names}}' | while read -r container; do
  echo "Checking container: $container"
  user=$(docker inspect "$container" --format '{{.Config.User}}')
  if [ -z "$user" ] || [ "$user" = "0" ] || [ "$user" = "root" ]; then
    echo "  [WARNING] Container $container runs as user '$user'"
  else
    echo "  [OK] User: $user"
  fi

  read_only=$(docker inspect "$container" --format '{{.HostConfig.ReadonlyRootfs}}')
  if [ "$read_only" != "true" ]; then
    echo "  [WARNING] Root filesystem is NOT read-only for $container"
  else
    echo "  [OK] Read-only root filesystem"
  fi

  cap_drop=$(docker inspect "$container" --format '{{.HostConfig.CapDrop}}')
  if [[ "$cap_drop" == *"ALL"* ]]; then
    echo "  [OK] Capabilities dropped (ALL)"
  else
    echo "  [WARNING] Capabilities not fully dropped: $cap_drop"
  fi
done
