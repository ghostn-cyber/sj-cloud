const { PolicyError } = require('../../shared/errors');
const { QuotaPolicy } = require('./quota-policy');
const { LifecyclePolicy } = require('./lifecycle-policy');
const { SecurityPolicy } = require('./security-policy');
const { RoutingPolicy } = require('./routing-policy');
const { BackupPolicy } = require('./backup-policy');

const policyMetrics = {
  tenant_policy_denials: 0
};

class PolicyEngine {
  constructor() {
    this.policies = [];
    this.registerDefaultPolicies();
  }

  registerDefaultPolicies() {
    this.policies.push(new QuotaPolicy());
    this.policies.push(new LifecyclePolicy());
    this.policies.push(new SecurityPolicy());
    this.policies.push(new RoutingPolicy());
    this.policies.push(new BackupPolicy());
  }

  register(policy) {
    this.policies.push(policy);
  }

  evaluate(action, tenantId, params = {}) {
    console.log(`[PolicyEngine] Evaluating policies for action "${action}" on tenant: ${tenantId}...`);
    
    for (const policy of this.policies) {
      const res = policy.evaluate(action, tenantId, params);
      if (res && res.allowed === false) {
        policyMetrics.tenant_policy_denials++;
        console.error(`[PolicyEngine] Policy check failed: ${res.reason}`);
        throw new PolicyError(`Policy evaluation denied: ${res.reason}`, {
          details: { action, tenantId, reason: res.reason }
        });
      }
    }
    
    console.log(`[PolicyEngine] All policies passed successfully for action: ${action}`);
    return true;
  }

  static getMetrics() {
    return policyMetrics;
  }
}

const globalPolicyEngine = new PolicyEngine();

module.exports = {
  PolicyEngine,
  globalPolicyEngine
};
