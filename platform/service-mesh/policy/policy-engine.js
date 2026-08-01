const PolicyLoader = require('./policy-loader');
const PolicyCache = require('./policy-cache');

class PolicyEngine {
  constructor() {
    this.cache = new PolicyCache();
  }

  resolveAndCache(serviceId, config, tenantPolicies = {}, env = 'production') {
    const resolved = PolicyLoader.loadFromServiceConfig(config, tenantPolicies, env);
    this.cache.set(serviceId, resolved);
    return resolved;
  }

  getResolvedPolicy(serviceId) {
    return this.cache.get(serviceId);
  }

  clear() {
    this.cache.clear();
  }
}

const globalPolicyEngine = new PolicyEngine();

module.exports = {
  PolicyEngine,
  globalPolicyEngine
};
