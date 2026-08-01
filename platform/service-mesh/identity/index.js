const ServiceIdentity = require('./service-identity');
const IdentityValidator = require('./identity-validator');
const IdentityResolver = require('./identity-resolver');
const { IdentityRegistry, globalIdentityRegistry } = require('./identity-registry');

module.exports = {
  ServiceIdentity,
  IdentityValidator,
  IdentityResolver,
  IdentityRegistry,
  globalIdentityRegistry
};
