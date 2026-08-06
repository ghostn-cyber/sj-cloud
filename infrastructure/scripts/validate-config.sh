#!/usr/bin/env bash
set -euo pipefail

# Configuration Validation Script for Traefik Ingress Foundation
# Runs entirely offline without starting any containers.

PROJECT_ROOT="/home/bokeh/Projects/sj-cloud"
INFRA_DIR="${PROJECT_ROOT}/infrastructure"

echo "=========================================="
echo "Running Static Configuration Validation..."
echo "=========================================="

# 1. Check for environment files
if [ ! -f "${INFRA_DIR}/.env" ]; then
  echo "❌ Error: .env file is missing in ${INFRA_DIR}!"
  exit 1
fi
echo "✅ Environment (.env) file is present."

# 2. Check for required static files
STATIC_CONFIG="${INFRA_DIR}/traefik/traefik.yml"
if [ ! -f "${STATIC_CONFIG}" ]; then
  echo "❌ Error: Static config ${STATIC_CONFIG} is missing!"
  exit 1
fi
echo "✅ Static config traefik.yml is present."

# 3. Check for dynamic configurations directory
DYNAMIC_DIR="${INFRA_DIR}/traefik/dynamic"
if [ ! -d "${DYNAMIC_DIR}" ]; then
  echo "❌ Error: Dynamic config directory ${DYNAMIC_DIR} is missing!"
  exit 1
fi
echo "✅ Dynamic config directory dynamic/ is present."

# 4. Check for TLS certificates directories
CERT_DIR="${INFRA_DIR}/traefik/certificates"
if [ ! -d "${CERT_DIR}/development" ] || [ ! -d "${CERT_DIR}/origin" ] || [ ! -d "${CERT_DIR}/acme" ] || [ ! -d "${CERT_DIR}/archive" ]; then
  echo "❌ Error: Certificate directory structure is invalid in ${CERT_DIR}!"
  exit 1
fi
echo "✅ Certificate directory structure verified."

# 5. Validate YAML Syntax of all configuration files
echo "Validating YAML file formats..."
validate_yaml() {
  local file=$1
  if ! python3 -c "import yaml; yaml.safe_load(open('${file}'))" 2>/dev/null; then
    echo "❌ Error: ${file} is not a valid YAML file!"
    exit 1
  fi
}

validate_yaml "${STATIC_CONFIG}"
for f in $(find "${DYNAMIC_DIR}" -name "*.yml" -o -name "*.yaml"); do
  validate_yaml "${f}"
done
echo "✅ YAML syntax for all static and dynamic configs is valid."

# 6. Check for duplicate routers, middlewares, and services
echo "Checking for duplicate dynamic configuration elements..."
python3 -c "
import os, sys, yaml
dynamic_dir = '${DYNAMIC_DIR}'
routers = set()
middlewares = set()
services = set()
duplicates = []

for root, dirs, files in os.walk(dynamic_dir):
    for f in files:
        if f.endswith('.yml') or f.endswith('.yaml'):
            path = os.path.join(root, f)
            with open(path, 'r') as fh:
                try:
                    data = yaml.safe_load(fh)
                except Exception as e:
                    print(f'❌ Error parsing {f}: {e}')
                    sys.exit(1)
                if not data:
                    continue
                http = data.get('http', {})
                for r in http.get('routers', {}).keys():
                    if r in routers:
                        duplicates.append(f'router \"{r}\"')
                    routers.add(r)
                for m in http.get('middlewares', {}).keys():
                    if m in middlewares:
                        duplicates.append(f'middleware \"{m}\"')
                    middlewares.add(m)
                for s in http.get('services', {}).keys():
                    if s in services:
                        duplicates.append(f'service \"{s}\"')
                    services.add(s)

if duplicates:
    print('❌ Error: Duplicate configurations found:')
    for d in duplicates:
        print(f'  - Duplicate {d}')
    sys.exit(1)
else:
    print('✅ No duplicate routers, middlewares, or services detected.')
"

# 7. Validate Docker Compose config file
echo "Validating docker-compose schema..."
(cd "${INFRA_DIR}" && docker compose --env-file .env -f compose/00-core.yml config >/dev/null)
echo "✅ Docker Compose schema is valid."

echo "=========================================="
echo "Static configuration validation successful!"
echo "=========================================="
