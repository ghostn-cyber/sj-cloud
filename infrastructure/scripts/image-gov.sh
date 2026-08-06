#!/usr/bin/env bash
set -euo pipefail
image=${1:-"nginx:latest"}
curl -s -X POST -H "Content-Type: application/json" -d "{\"image\":\"$image\"}" http://localhost:8083/admin/infrastructure/image/validate
