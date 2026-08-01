const fs = require('fs');
const path = require('path');
const { LifecycleError } = require('../../shared/errors');

class WorkspaceCreator {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  create(tenantId) {
    const dir = path.join(this.tenantsDir, tenantId);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return dir;
    } catch (err) {
      throw new LifecycleError(`Failed to create workspace directory for ${tenantId}: ${err.message}`, { rootCause: err });
    }
  }

  destroy(tenantId) {
    const dir = path.join(this.tenantsDir, tenantId);
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Failed to clean workspace directory for ${tenantId}:`, err.message);
    }
  }
}

module.exports = {
  WorkspaceCreator
};
