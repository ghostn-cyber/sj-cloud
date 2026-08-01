const { IdentityError } = require('../../shared/errors');

class IdentityValidator {
  static validate(identity) {
    if (!identity.serviceId || typeof identity.serviceId !== 'string') {
      throw new IdentityError('ServiceIdentity: serviceId is required and must be a string');
    }
    if (!/^[a-z0-9-]+$/.test(identity.serviceId)) {
      throw new IdentityError(`ServiceIdentity: invalid serviceId format "${identity.serviceId}"`);
    }
    if (!identity.namespace || typeof identity.namespace !== 'string') {
      throw new IdentityError('ServiceIdentity: namespace is required');
    }
    if (!['high', 'medium', 'low'].includes(identity.trustLevel)) {
      throw new IdentityError(`ServiceIdentity: invalid trustLevel "${identity.trustLevel}"`);
    }
    return true;
  }
}

module.exports = IdentityValidator;
