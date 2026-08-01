const { ValidationError } = require('../../shared/errors');

class ReleaseValidator {
  validate(release) {
    if (!release.application_id) {
      throw new ValidationError('Release is missing application_id');
    }
    if (!release.image_digest) {
      throw new ValidationError('Release is missing image_digest');
    }
    if (!release.checksum) {
      throw new ValidationError('Release is missing immutable checksum');
    }
    return true;
  }
}

module.exports = { ReleaseValidator };
