const ServiceIdentity = require('./service-identity');
const IdentityValidator = require('./identity-validator');

class IdentityResolver {
  /**
   * Resolve ServiceIdentity from parsed service configuration spec
   * @param {Object} spec The parsed service configuration
   * @returns {ServiceIdentity}
   */
  static resolve(spec) {
    const service = spec.service || {};
    const kubernetes = spec.kubernetes || {};

    const identity = new ServiceIdentity({
      serviceId: service.id,
      namespace: kubernetes.namespace || 'default',
      environment: service.environment || 'production',
      version: service.version || '1.0.0',
      owner: service.owner || 'unknown',
      trustLevel: service.trust_level || 'low',
      capabilities: service.capabilities || [],
      labels: service.labels || {},
      metadata: {
        resourceClass: service.resource_class || (spec.resources && spec.resources.class) || 'standard',
        network: service.network || 'default',
        visibility: service.visibility || 'private',
        runtimeClass: service.runtime_class || 'default',
        dependencies: service.dependencies || [],
        ...service.metadata
      }
    });

    IdentityValidator.validate(identity);
    return identity;
  }
}

module.exports = IdentityResolver;
