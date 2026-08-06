#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPTS_DIR}/.."
CERT_FILE="${INFRA_DIR}/certificates/sj-cloud.test.crt"

echo "=========================================="
echo "Verifying SSL/TLS Certificates..."
echo "=========================================="

if [ ! -f "${CERT_FILE}" ]; then
  echo "ERROR: Certificate file not found at ${CERT_FILE}"
  exit 1
fi

# 1. Integrity / Parse verification
echo "Parsing certificate file..."
openssl x509 -in "${CERT_FILE}" -text -noout > /dev/null
echo "  [OK] Certificate is structurally valid."

# 2. Expiration Verification
echo "Checking expiration date..."
expiry_date=$(openssl x509 -enddate -noout -in "${CERT_FILE}" | cut -d= -f2)
expiry_epoch=$(date -d "${expiry_date}" +%s)
now_epoch=$(date +%s)
diff_seconds=$((expiry_epoch - now_epoch))
diff_days=$((diff_seconds / 86400))

echo "  Expiration Date: ${expiry_date}"
echo "  Days Remaining:  ${diff_days}"

if [ "${diff_days}" -le 0 ]; then
  echo "ERROR: Certificate has expired!"
  exit 1
elif [ "${diff_days}" -lt 30 ]; then
  echo "WARNING: Certificate will expire soon (less than 30 days remaining)."
else
  echo "  [OK] Certificate is active and valid."
fi

# 3. Subject Alternative Name (SAN) Verification
echo "Verifying Subject Alternative Names (SANs)..."
sans=$(openssl x509 -in "${CERT_FILE}" -text -noout | grep -A 1 "Subject Alternative Name" || true)

required_sans=(
  "DNS:sj-cloud.test"
  "DNS:*.sj-cloud.test"
  "DNS:*.tenant.sj-cloud.test"
)

for san in "${required_sans[@]}"; do
  if echo "${sans}" | grep -qF "${san}"; then
    echo "  [OK] Found SAN: ${san}"
  else
    echo "ERROR: Missing required SAN: ${san}"
    exit 1
  fi
done

echo "Verification successfully completed!"
echo "=========================================="
