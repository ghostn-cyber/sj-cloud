#!/usr/bin/env bash
set -euo pipefail
curl -s -X POST -H "Content-Type: application/json" http://localhost:8083/admin/infrastructure/dr/snapshot
