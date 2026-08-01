const { globalTenantRegistry } = require('../registry/tenant-registry');

class DesiredState {
  static get(tenantId) {
    return globalTenantRegistry.getTenant(tenantId) || null;
  }
}

module.exports = { DesiredState };
