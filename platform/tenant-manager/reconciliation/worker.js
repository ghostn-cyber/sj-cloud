const { DesiredState } = require('../specification/desired-state');
const { ActualState } = require('../specification/actual-state');
const { Planner } = require('./planner');
const { Executor } = require('./executor');

const reconciliationMetrics = {
  tenant_reconcile_total: 0,
  tenant_drift_total: 0,
  tenant_runtime_recoveries: 0
};

class Worker {
  constructor(tenantsDir) {
    this.actualStateChecker = new ActualState(tenantsDir);
    this.planner = new Planner();
    this.executor = new Executor(tenantsDir);
  }

  async reconcileTenant(tenantId) {
    reconciliationMetrics.tenant_reconcile_total++;
    const desired = DesiredState.get(tenantId);
    const actual = this.actualStateChecker.get(tenantId);

    const plan = this.planner.plan(desired, actual);
    if (plan.length > 0) {
      reconciliationMetrics.tenant_drift_total += plan.length;
      const res = await this.executor.execute(tenantId, plan);
      if (res && res.repaired && res.repaired.length > 0) {
        reconciliationMetrics.tenant_runtime_recoveries += res.repaired.length;
      }
      return res;
    }
    return { success: true, drifted: false, repaired: [] };
  }

  static getMetrics() {
    return reconciliationMetrics;
  }
}

module.exports = {
  Worker,
  reconciliationMetrics
};
