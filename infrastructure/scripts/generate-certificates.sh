#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPTS_DIR}/.."
CERT_DIR="${INFRA_DIR}/certificates"
TRAEFIK_CERT_DIR="${INFRA_DIR}/traefik/certs"

mkdir -p "${CERT_DIR}" "${TRAEFIK_CERT_DIR}"

echo "=========================================="
echo "Generating SSL/TLS Wildcard Certificates..."
echo "=========================================="

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${CERT_DIR}/sj-cloud.test.key" \
  -out "${CERT_DIR}/sj-cloud.test.crt" \
  -subj "/CN=sj-cloud.test/O=SJ Cloud/OU=Local Development" \
  -addext "subjectAltName=DNS:sj-cloud.test,DNS:*.sj-cloud.test,DNS:*.tenant.sj-cloud.test"

# Set permissions so Traefik (running as non-root) can read them
chmod 644 "${CERT_DIR}/sj-cloud.test.key" "${CERT_DIR}/sj-cloud.test.crt"

# Copy to Traefik certs directory
cp -f "${CERT_DIR}/sj-cloud.test.crt" "${TRAEFIK_CERT_DIR}/sj-cloud.test.crt"
cp -f "${CERT_DIR}/sj-cloud.test.key" "${TRAEFIK_CERT_DIR}/sj-cloud.test.key"
chmod 644 "${TRAEFIK_CERT_DIR}/sj-cloud.test.key" "${TRAEFIK_CERT_DIR}/sj-cloud.test.crt"

echo "Certificates generated successfully!"
echo "Files:"
echo "  - ${CERT_DIR}/sj-cloud.test.crt"
echo "  - ${CERT_DIR}/sj-cloud.test.key"
echo "=========================================="
