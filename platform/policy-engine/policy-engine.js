const { PolicyEvents } = require('./policy-events');
const { globalPolicyValidator } = require('./policy-validator');

class PolicyEngine {
  constructor() {
    this.policies = [
      { ruleName: 'ContainerSecurityHardening', description: 'Enforce read-only root FS and non-root users' }
    ];
  }

  evaluate(resourceType, resource) {
    const results = [];
    for (const policy of this.policies) {
      const res = globalPolicyValidator.validate(policy, resource);
      PolicyEvents.emit('PolicyEvaluated', policy.ruleName, resourceType, res.pass ? 'PASS' : 'FAIL', { reason: res.reason });
      results.push({ policy: policy.ruleName, ...res });
    }
    return { valid: results.every(r => r.pass), results };
  }
}

const globalPolicyEngine = new PolicyEngine();
module.exports = { PolicyEngine, globalPolicyEngine };
