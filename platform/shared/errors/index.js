class PlatformError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.error_code = options.error_code || 'PLATFORM_ERROR';
    this.category = options.category || 'GENERAL';
    this.severity = options.severity || 'ERROR';
    this.timestamp = options.timestamp || new Date().toISOString();
    this.component = options.component || 'platform';
    this.details = options.details || null;
    this.recoverable = options.recoverable !== undefined ? options.recoverable : false;
    this.rootCause = options.rootCause || null;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      error: this.name,
      error_code: this.error_code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      component: this.component,
      message: this.message,
      details: this.details,
      recoverable: this.recoverable,
      rootCause: this.rootCause ? (this.rootCause.stack || this.rootCause.message || this.rootCause) : null
    };
  }
}

class RuntimeError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'RUNTIME_ERROR', category: 'RUNTIME', component: 'runtime', ...options });
  }
}

class CompilerError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'COMPILER_ERROR', category: 'COMPILER', component: 'compiler', ...options });
  }
}

class RegistryError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'REGISTRY_ERROR', category: 'REGISTRY', component: 'registry', ...options });
  }
}

class PolicyError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'POLICY_ERROR', category: 'POLICY', component: 'policy', ...options });
  }
}

class ValidationError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'VALIDATION_ERROR', category: 'VALIDATION', component: 'validation', ...options });
  }
}

class RoutingError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'ROUTING_ERROR', category: 'ROUTING', component: 'routing', ...options });
  }
}

class IdentityError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'IDENTITY_ERROR', category: 'IDENTITY', component: 'identity', ...options });
  }
}

class PluginError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'PLUGIN_ERROR', category: 'PLUGIN', component: 'plugin', ...options });
  }
}

class ObservabilityError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'OBSERVABILITY_ERROR', category: 'OBSERVABILITY', component: 'observability', ...options });
  }
}

class LifecycleError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'LIFECYCLE_ERROR', category: 'LIFECYCLE', component: 'lifecycle', ...options });
  }
}

class ApplicationError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'APPLICATION_ERROR', category: 'APPLICATION', component: 'application', ...options });
  }
}

class BuildError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'BUILD_ERROR', category: 'BUILD', component: 'build', ...options });
  }
}

class ReleaseError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'RELEASE_ERROR', category: 'RELEASE', component: 'release', ...options });
  }
}

class DeploymentError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'DEPLOYMENT_ERROR', category: 'DEPLOYMENT', component: 'deployment', ...options });
  }
}

class HealthError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'HEALTH_ERROR', category: 'HEALTH', component: 'health', ...options });
  }
}

class RollbackError extends PlatformError {
  constructor(message, options = {}) {
    super(message, { error_code: 'ROLLBACK_ERROR', category: 'ROLLBACK', component: 'rollback', ...options });
  }
}

module.exports = {
  PlatformError,
  RuntimeError,
  CompilerError,
  RegistryError,
  PolicyError,
  ValidationError,
  RoutingError,
  IdentityError,
  PluginError,
  ObservabilityError,
  LifecycleError,
  ApplicationError,
  BuildError,
  ReleaseError,
  DeploymentError,
  HealthError,
  RollbackError
};
