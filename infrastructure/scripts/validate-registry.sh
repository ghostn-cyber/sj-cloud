#!/usr/bin/env bash
set -euo pipefail

# Set working directory to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../" && pwd)"
cd "${PROJECT_ROOT}"

echo "=== Running Service Registry Validation ==="

# 1. Ensure npm dependencies are installed for the platform/service-mesh
if [ ! -d "platform/service-mesh/node_modules" ]; then
  echo "Installing Node.js dependencies for Service Mesh..."
  cd platform/service-mesh && npm install && cd "${PROJECT_ROOT}"
fi

# Make CLI scripts executable
chmod +x platform/service-mesh/registry/cli/registry-*

# 2. Run validation and compilation
echo "Validating and compiling service definitions..."
node platform/service-mesh/registry/cli/registry-loader

if [ ! -f "config/services/snapshot.json" ]; then
  echo "❌ Error: snapshot.json was not generated."
  exit 1
fi

echo "✅ Registry compilation validation passed successfully."
exit 0
