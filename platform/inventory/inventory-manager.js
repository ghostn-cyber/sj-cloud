const fs = require('fs');
const path = require('path');

class InventoryManager {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  discover() {
    const inventory = {
      timestamp: new Date().toISOString(),
      tenants: [],
      networks: ['sj-edge', 'sj-proxy', 'sj-control-plane', 'sj-services', 'sj-data', 'sj-monitoring', 'sj-observability', 'sj-backup', 'sj-build', 'sj-ci'],
      services: ['postgres', 'redis', 'minio', 'registry-api', 'mesh-proxy']
    };

    if (fs.existsSync(this.tenantsDir)) {
      const tenants = fs.readdirSync(this.tenantsDir);
      for (const tenantId of tenants) {
        const tenantPath = path.join(this.tenantsDir, tenantId);
        if (fs.statSync(tenantPath).isDirectory()) {
          const secretsPath = path.join(tenantPath, 'secrets', 'secrets.json');
          const certsPath = path.join(tenantPath, 'certificates');
          inventory.tenants.push({
            id: tenantId,
            hasSecrets: fs.existsSync(secretsPath),
            certificates: fs.existsSync(certsPath) ? fs.readdirSync(certsPath) : []
          });
        }
      }
    }

    return inventory;
  }
}

const globalInventoryManager = new InventoryManager();
module.exports = { InventoryManager, globalInventoryManager };
