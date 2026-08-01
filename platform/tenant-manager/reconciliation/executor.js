const { TenantReconciler } = require('../specification/tenant-reconciler');

class Executor {
  constructor(tenantsDir) {
    this.reconciler = new TenantReconciler(tenantsDir);
  }

  async execute(tenantId, plan) {
    if (plan && plan.length > 0) {
      return await this.reconciler.reconcile(tenantId);
    }
    return { success: true, drifted: false, repaired: [] };
  }
}

module.exports = { Executor };
