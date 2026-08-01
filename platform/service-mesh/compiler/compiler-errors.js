const { CompilerError } = require('../../shared/errors');

class CompilerValidationError extends CompilerError {
  constructor(message, details = null) {
    super(message, { error_code: 'COMPILER_VALIDATION_ERROR', details });
  }
}

class PolicyResolutionError extends CompilerError {
  constructor(message, details = null) {
    super(message, { error_code: 'POLICY_RESOLUTION_ERROR', details });
  }
}

class IdentityResolutionError extends CompilerError {
  constructor(message, details = null) {
    super(message, { error_code: 'IDENTITY_RESOLUTION_ERROR', details });
  }
}

class DependencyGraphError extends CompilerError {
  constructor(message, details = null) {
    super(message, { error_code: 'DEPENDENCY_GRAPH_ERROR', details });
  }
}

module.exports = {
  CompilerValidationError,
  PolicyResolutionError,
  IdentityResolutionError,
  DependencyGraphError
};
