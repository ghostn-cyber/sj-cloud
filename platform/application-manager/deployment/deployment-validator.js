const { ValidationError } = require('../../shared/errors');

class DeploymentValidator {
  validate(appConfig, release) {
    if (!appConfig) {
      throw new ValidationError('Application configuration is missing');
    }
    if (!release) {
      throw new ValidationError('Deployment target release is missing');
    }
    if (appConfig.application_id !== release.application_id) {
      throw new ValidationError(`Release application ID (${release.application_id}) does not match app config (${appConfig.application_id})`);
    }
    return true;
  }
}

module.exports = { DeploymentValidator };
