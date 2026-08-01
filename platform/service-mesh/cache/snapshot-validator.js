const { ValidationError } = require('../errors');

class SnapshotValidator {
  static validate(snapshot) {
    if (!snapshot) {
      throw new ValidationError('Snapshot is null or undefined');
    }
    if (!snapshot.services || typeof snapshot.services !== 'object') {
      throw new ValidationError('Snapshot missing "services" object');
    }
    if (!snapshot.compiledAt) {
      throw new ValidationError('Snapshot missing "compiledAt" timestamp');
    }
    if (!snapshot.sha256) {
      throw new ValidationError('Snapshot missing "sha256" checksum');
    }
    return true;
  }
}

module.exports = SnapshotValidator;
