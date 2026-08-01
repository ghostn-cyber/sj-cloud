const CompilerValidator = require('./compiler-validator');
const { IdentityResolver } = require('../identity');
const { PolicyLoader } = require('../policy');
const { ValidationError } = require('../errors');

class CompilerPipeline {
  constructor() {
    this.validator = new CompilerValidator();
  }

  process(id, rawConfig) {
    // 1. Validation and Schema checks
    this.validator.validate(rawConfig);

    const spec = rawConfig.spec;

    // 2. Identity Resolution
    const identity = IdentityResolver.resolve(spec);

    // 3. Policy Resolution
    const resolvedPolicies = PolicyLoader.loadFromServiceConfig(spec);

    // 4. Return processed/compiled service bundle containing spec merged with identity and policies
    // We preserve the legacy flat format at the top level for backward compatibility.
    return {
      ...spec,
      identity: identity.toJSON(),
      policies: resolvedPolicies,
      spec // Preserve spec envelope
    };
  }

  validateDependencies(compiledServices) {
    const serviceIds = new Set(Object.keys(compiledServices));
    for (const [id, service] of Object.entries(compiledServices)) {
      const dependencies = service.identity.metadata.dependencies || service.spec.service.dependencies || [];
      for (const dep of dependencies) {
        // Infrastructure resources do not need registry entries
        if (['postgres', 'redis', 'memcached', 'rabbitmq', 'mysql', 'minio', 'elasticsearch', 'kafka', 'cassandra', 'influxdb'].includes(dep)) {
          continue;
        }
        if (!serviceIds.has(dep)) {
          throw new ValidationError(`Service "${id}" specifies dependency "${dep}" which is not found in the service registry.`);
        }
      }
    }
  }
}

module.exports = CompilerPipeline;
