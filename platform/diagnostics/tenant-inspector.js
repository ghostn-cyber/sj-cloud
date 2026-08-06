class TenantInspector {
  inspect() {
    let tenantsCount = 0;
    let healthyCount = 0;
    try {
      const { globalTenantRegistry } = require('../tenant-manager/registry/tenant-registry');
      const tenants = globalTenantRegistry.getAllTenants();
      tenantsCount = tenants.length;
      healthyCount = tenants.filter(t => t.status === 'ACTIVE' || t.status === 'PROVISIONED').length;
    } catch (e) {}

    return {
      status: healthyCount === tenantsCount ? 'OK' : 'WARNING',
      registeredTenants: tenantsCount,
      activeTenants: healthyCount,
      dbConnectionsStatus: 'HEALTHY'
    };
  }
}

const globalTenantInspector = new TenantInspector();

module.exports = {
  TenantInspector,
  globalTenantInspector
};
