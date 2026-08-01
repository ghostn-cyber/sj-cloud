const { SchemaValidator } = require('../registry/validator');
const { CompilerValidationError } = require('./compiler-errors');

class CompilerValidator {
  constructor() {
    this.schemaValidator = new SchemaValidator();
  }

  validate(config) {
    if (!config) {
      throw new CompilerValidationError('Configuration is null or undefined');
    }

    if (config.apiVersion !== 'mesh.sjcloud.io/v1alpha1') {
      throw new CompilerValidationError(`Unsupported apiVersion: "${config.apiVersion}"`);
    }

    if (config.kind !== 'Service') {
      throw new CompilerValidationError(`Unsupported kind: "${config.kind}"`);
    }

    if (config.schemaVersion !== 1) {
      throw new CompilerValidationError(`Unsupported schemaVersion: "${config.schemaVersion}"`);
    }

    if (!config.metadata || !config.metadata.name) {
      throw new CompilerValidationError('Missing metadata.name in service configuration');
    }

    const schemaResult = this.schemaValidator.validate(config);
    if (!schemaResult.valid) {
      throw new CompilerValidationError(`Schema validation failed: ${schemaResult.errors.join(', ')}`);
    }

    return true;
  }
}

module.exports = CompilerValidator;
