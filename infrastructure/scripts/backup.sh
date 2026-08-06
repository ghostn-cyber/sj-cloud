#!/usr/bin/env bash
set -euo pipefail
tenant_id=${1:-"tenant-1"}
curl -s -H "Content-Type: application/json" "http://localhost:8083/admin/infrastructure/backups?tenantId=$tenant_id"
