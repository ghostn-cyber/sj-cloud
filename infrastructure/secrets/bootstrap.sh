#!/usr/bin/env bash
set -euo pipefail

# Bootstrap secrets engine
SECRETS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SECRETS_DIR}/../.env"
ENV_EXAMPLE="${SECRETS_DIR}/../.env.example"

echo "=========================================="
echo "Initializing Platform Secrets..."
echo "=========================================="

if [ ! -f "${ENV_FILE}" ]; then
  echo "No .env found. Creating from .env.example..."
  cp "${ENV_EXAMPLE}" "${ENV_FILE}"
fi

# Helper function to generate cryptographic secure hex/base64 strings
generate_secret() {
  openssl rand -hex 24
}

# Key fields to check and bootstrap
declare -A default_secrets=(
  ["DB_PASSWORD"]="$(generate_secret)"
  ["REDIS_PASSWORD"]="$(generate_secret)"
  ["MINIO_ROOT_PASSWORD"]="$(generate_secret)"
  ["JWT_SECRET"]="$(openssl rand -base64 32)"
  ["API_GATEWAY_KEY"]="$(generate_secret)"
  ["GRAFANA_ADMIN_PASSWORD"]="$(generate_secret)"
)

# Loop and ensure variables are populated
for key in "${!default_secrets[@]}"; do
  # Check if key is already defined in .env and is not empty or a placeholder
  if grep -q "^${key}=" "${ENV_FILE}" && [ -n "$(grep "^${key}=" "${ENV_FILE}" | cut -d'=' -f2-)" ] && ! grep -q "^${key}=placeholder" "${ENV_FILE}"; then
    echo "  ${key} is already configured."
  else
    value="${default_secrets[$key]}"
    echo "  Generating secure credentials for ${key}..."
    
    # Remove existing key entry if any
    sed -i "/^${key}=/d" "${ENV_FILE}"
    echo "${key}=${value}" >> "${ENV_FILE}"
  fi
done

# Now extract secrets from .env and write to secret files
get_env_val() {
  grep "^$1=" "${ENV_FILE}" | cut -d'=' -f2-
}

echo "sjminio" > "${SECRETS_DIR}/minio_root_user"
get_env_val "DB_PASSWORD" > "${SECRETS_DIR}/postgres_password"
get_env_val "REDIS_PASSWORD" > "${SECRETS_DIR}/redis_password"
get_env_val "MINIO_ROOT_PASSWORD" > "${SECRETS_DIR}/minio_root_password"
get_env_val "GRAFANA_ADMIN_PASSWORD" > "${SECRETS_DIR}/grafana_admin_password"
get_env_val "JWT_SECRET" > "${SECRETS_DIR}/jwt_secret"
get_env_val "API_GATEWAY_KEY" > "${SECRETS_DIR}/encryption_key"

chmod 600 "${SECRETS_DIR}"/* 2>/dev/null || true
chmod +x "${SECRETS_DIR}/bootstrap.sh"

echo "Secrets bootstrap successfully completed!"
echo "=========================================="
