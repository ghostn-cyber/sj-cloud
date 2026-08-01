const PolicyResolver = require('./policy-resolver');
const PolicyValidator = require('./policy-validator');

class PolicyLoader {
  static loadFromServiceConfig(config = {}, tenantPolicies = {}, env = 'production') {
    const spec = config.spec || config; // Supports versioned spec envelope or legacy flat structure
    const resolved = PolicyResolver.resolve(spec, tenantPolicies, env);
    PolicyValidator.validate(resolved);
    return resolved;
  }
}

module.exports = PolicyLoader;
