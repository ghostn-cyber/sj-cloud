#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_FILE="${SCRIPTS_DIR}/../certificates/sj-cloud.test.crt"

echo "=========================================="
echo "Starting Certificate Monitor..."
echo "=========================================="

if [ ! -f "${CERT_FILE}" ]; then
  echo "Certificate is missing. Initializing rotation..."
  bash "${SCRIPTS_DIR}/rotate-certificates.sh"
  exit 0
fi

# Extract days remaining
expiry_date=$(openssl x509 -enddate -noout -in "${CERT_FILE}" | cut -d= -f2)
expiry_epoch=$(date -d "${expiry_date}" +%s)
now_epoch=$(date +%s)
diff_seconds=$((expiry_epoch - now_epoch))
diff_days=$((diff_seconds / 86400))

echo "Days remaining for certificate: ${diff_days}"

# Auto-rotate if remaining days < 30
if [ "${diff_days}" -lt 30 ]; then
  echo "Certificate is within renewal window (less than 30 days remaining). Triggering auto-renewal..."
  bash "${SCRIPTS_DIR}/rotate-certificates.sh"
else
  echo "Certificate is healthy. No action required."
fi

echo "=========================================="
