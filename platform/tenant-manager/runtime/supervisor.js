const { Watchdog } = require('./watchdog');
const { Recovery } = require('./recovery');

const supervisorMetrics = {
  tenant_runtime_recoveries: 0
};

class Supervisor {
  constructor(tenantsDir) {
    this.watchdog = new Watchdog(tenantsDir);
    this.recovery = new Recovery(tenantsDir);
  }

  async superviseTenant(tenantId) {
    const health = await this.watchdog.checkTenantHealth(tenantId);
    if (health.status === 'UNHEALTHY') {
      console.log(`[Supervisor] Tenant ${tenantId} is UNHEALTHY due to: ${health.reasons.join(', ')}`);
      
      for (const reason of health.reasons) {
        const success = await this.recovery.recover(tenantId, reason);
        if (success) {
          supervisorMetrics.tenant_runtime_recoveries++;
        }
      }
      
      // Re-check health after recovery attempts
      return await this.watchdog.checkTenantHealth(tenantId);
    }
    return health;
  }

  static getMetrics() {
    return supervisorMetrics;
  }
}

module.exports = {
  Supervisor,
  supervisorMetrics
};
