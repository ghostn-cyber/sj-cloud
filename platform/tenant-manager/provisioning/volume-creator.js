const fs = require('fs');
const path = require('path');
const { LifecycleError } = require('../../shared/errors');

class VolumeCreator {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  create(tenantId) {
    const tenantDir = path.join(this.tenantsDir, tenantId);
    const dataDir = path.join(tenantDir, 'data');
    const logsDir = path.join(tenantDir, 'logs');
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      return { dataDir, logsDir };
    } catch (err) {
      throw new LifecycleError(`Failed to create volumes for tenant ${tenantId}: ${err.message}`, { rootCause: err });
    }
  }
}

module.exports = {
  VolumeCreator
};
