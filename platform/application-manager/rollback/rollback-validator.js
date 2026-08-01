const { ValidationError } = require('../../shared/errors');

class RollbackValidator {
  validate(targetRelease) {
    if (!targetRelease) {
      throw new ValidationError('Rollback target release cannot be null or undefined');
    }
    if (!targetRelease.release_id) {
      throw new ValidationError('Rollback target release is missing release_id');
    }
    if (!targetRelease.image_digest) {
      throw new ValidationError('Rollback target release is missing image_digest');
    }
    return true;
  }
}

module.exports = { RollbackValidator };
