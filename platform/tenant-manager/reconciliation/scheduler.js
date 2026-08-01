const { globalTenantRegistry } = require('../registry/tenant-registry');
const { Worker } = require('./worker');

class Scheduler {
  constructor(tenantsDir, intervalMs = 5000) {
    this.worker = new Worker(tenantsDir);
    this.intervalMs = intervalMs;
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      const tenants = globalTenantRegistry.getAllTenants();
      for (const tenant of tenants) {
        try {
          await this.worker.reconcileTenant(tenant.tenant_id);
        } catch (err) {
          console.error(`Error reconciling tenant ${tenant.tenant_id} in background:`, err.message);
        }
      }
    }, this.intervalMs);
    // Unref timer so that it doesn't prevent Node from exiting in scripts/tests
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

module.exports = { Scheduler };
