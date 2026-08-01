const { ValidationError } = require('../../shared/errors');

class ImageValidator {
  validate(image) {
    if (!image || typeof image !== 'string') {
      throw new ValidationError('Image reference must be a non-empty string');
    }
    // Basic image format check (e.g. registry/repo/image:tag or digest)
    if (image.includes(' ') || image.includes('\n')) {
      throw new ValidationError('Image reference contains invalid whitespace characters');
    }
    return true;
  }
}

module.exports = { ImageValidator };
