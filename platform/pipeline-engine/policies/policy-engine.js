const { PolicyValidator } = require('./policy-validator');
const { PolicyLoader } = require('./policy-loader');
const { PolicyError } = require('../../shared/errors');

class PolicyEngine {
  constructor() {
    this.validator = new PolicyValidator();
    this.loader = new PolicyLoader();
    this.policies = [];
    this.initialize();
  }

  initialize() {
    const loaded = this.loader.loadDefaultPolicies();
    for (const policy of loaded) {
      this.register(policy);
    }
  }

  register(policy) {
    this.validator.validate(policy);
    this.policies.push(policy);
  }

  evaluate(context) {
    for (const policy of this.policies) {
      const res = policy.evaluate(context);
      if (res && res.allowed === false) {
        throw new PolicyError(`Pipeline Policy Denial: ${res.reason}`, {
          details: { reason: res.reason, tenantId: context.tenantId, appId: context.appId }
        });
      }
    }
    return true;
  }
}

const globalPipelinePolicyEngine = new PolicyEngine();

module.exports = {
  PolicyEngine,
  globalPipelinePolicyEngine
};
