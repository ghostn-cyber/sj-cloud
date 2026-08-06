#!/usr/bin/env bash
set -euo pipefail
tenant_id=${1:-"tenant-1"}
if [ "$#" -eq 2 ]; then
  curl -s -X POST -H "Content-Type: application/json" -d "$2" "http://localhost:8083/admin/infrastructure/quota?tenantId=$tenant_id"
else
  curl -s -H "Content-Type: application/json" "http://localhost:8083/admin/infrastructure/quota?tenantId=$tenant_id"
fi
