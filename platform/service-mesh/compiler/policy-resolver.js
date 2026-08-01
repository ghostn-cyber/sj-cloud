const { PolicyResolver: BasePolicyResolver } = require('../policy');

class PolicyResolver {
  static resolve(spec) {
    const env = (spec.service && spec.service.environment) || 'development';
    return BasePolicyResolver.resolve(spec, {}, env).toJSON();
  }
}

module.exports = PolicyResolver;
