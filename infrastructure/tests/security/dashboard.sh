#!/usr/bin/env bash
set -euo pipefail

# Dashboard Security Compliance Tests

echo "=========================================="
echo "Running Dashboard Security Tests..."
echo "=========================================="

# 1. Test that accessing the dashboard without authentication returns 401 Unauthorized
echo "Testing unauthenticated dashboard request..."
STATUS_UNAUTH=$(curl -k -s -o /dev/null -w "%{http_code}" --resolve "dashboard.platform.test:443:127.0.0.1" https://dashboard.platform.test/dashboard/)

if [ "${STATUS_UNAUTH}" != "401" ]; then
  echo "❌ Error: Dashboard is exposed without authentication! (Status: ${STATUS_UNAUTH})"
  exit 1
fi
echo "✅ Dashboard access without auth returned 401 Unauthorized as expected."

# 2. Test that accessing the dashboard with correct basic authentication works (redirects or 200)
echo "Testing authenticated dashboard request..."
STATUS_AUTH=$(curl -k -s -o /dev/null -w "%{http_code}" -u "admin:sjcloudadmin" --resolve "dashboard.platform.test:443:127.0.0.1" https://dashboard.platform.test/dashboard/)

if [ "${STATUS_AUTH}" != "200" ] && [ "${STATUS_AUTH}" != "302" ] && [ "${STATUS_AUTH}" != "307" ]; then
  echo "❌ Error: Dashboard failed authentication with valid credentials! (Status: ${STATUS_AUTH})"
  exit 1
fi
echo "✅ Dashboard access with valid auth returned status ${STATUS_AUTH}."

# 3. Test that response contains architectural security headers
echo "Verifying secure headers in response..."
HEADERS=$(curl -k -s -I -u "admin:sjcloudadmin" --resolve "dashboard.platform.test:443:127.0.0.1" https://dashboard.platform.test/dashboard/ | tr '[:upper:]' '[:lower:]')

# Check security headers
for header in "x-frame-options: deny" "x-content-type-options: nosniff" "content-security-policy" "strict-transport-security"; do
  if ! echo "${HEADERS}" | grep -q "${header}"; then
    echo "❌ Error: Security header '${header}' was missing or incorrect!"
    exit 1
  fi
done
echo "✅ Response contains all mandated security headers (X-Frame-Options, X-Content-Type-Options, CSP, HSTS)."

echo "=========================================="
echo "Dashboard security compliance tests passed!"
echo "=========================================="
