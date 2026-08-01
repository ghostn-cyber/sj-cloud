const DefaultPolicy = require('./default-policy');
const ResolvedPolicy = require('./resolved-policy');
const PolicyMerger = require('./policy-merger');

class PolicyResolver {
  /**
   * Merge default, service, tenant, and environment policies
   * @param {Object} serviceSpec Policy section of service configuration
   * @param {Object} tenantPolicies Override policies from tenant context
   * @param {string} env Environment override string
   */
  static resolve(serviceSpec = {}, tenantPolicies = {}, env = 'production') {
    // 1. Merge default + serviceSpec overrides + tenant policies
    let merged = PolicyMerger.merge(DefaultPolicy, serviceSpec, tenantPolicies);

    // 2. Merge environment-specific overrides
    if (env === 'development') {
      if (merged.timeouts) {
        merged.timeouts.read_ms = Math.min(merged.timeouts.read_ms, 5000);
      }
    }

    return new ResolvedPolicy(merged);
  }
}

module.exports = PolicyResolver;
