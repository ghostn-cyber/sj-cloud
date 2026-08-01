const sharedErrors = require('../../shared/errors');
const PlatformError = sharedErrors.PlatformError;
const RuntimeError = sharedErrors.RuntimeError;
const RegistryError = sharedErrors.RegistryError;
const CompilerError = sharedErrors.CompilerError;
const PolicyError = sharedErrors.PolicyError;
const ValidationError = sharedErrors.ValidationError;

// Keep compatibility for older specific errors
const MeshError = require('./MeshError');
const ConfigurationError = require('./ConfigurationError');

module.exports = {
  PlatformError,
  RuntimeError,
  RegistryError,
  CompilerError,
  PolicyError,
  MeshError,
  ConfigurationError,
  ValidationError,
  ...sharedErrors
};
