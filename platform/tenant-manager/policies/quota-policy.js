const { globalTenantRegistry } = require('../registry/tenant-registry');

class QuotaPolicy {
  constructor() {
    this.maxActiveTenants = 20;
  }

  evaluate(action, tenantId, params = {}) {
    if (action === 'provision') {
      const activeCount = globalTenantRegistry.getAllTenants().filter(t => t.status === 'ACTIVE').length;
      if (activeCount >= this.maxActiveTenants) {
        return {
          allowed: false,
          reason: `Global active tenant quota exceeded. Maximum allowed: ${this.maxActiveTenants}`
        };
      }

      // Check plan limits
      const plan = params.plan || 'standard';
      const memoryLimit = params.runtime && params.runtime.memory;
      if (plan === 'standard' && memoryLimit && parseInt(memoryLimit) > 2048) {
        return {
          allowed: false,
          reason: 'Standard plan tenants cannot exceed 2048MB of memory'
        };
      }
    }
    return { allowed: true };
  }
}

module.exports = { QuotaPolicy };
