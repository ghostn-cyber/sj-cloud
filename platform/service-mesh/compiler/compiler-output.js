const crypto = require('crypto');

class CompilerOutput {
  static format(services, version = '1.0.0', buildNumber = 1) {
    const rawSnapshot = {
      services,
      compiledAt: new Date().toISOString(),
      version,
      buildNumber,
      compilerVersion: '1.0.0',
      registryVersion: '1.0.0',
      gitCommit: process.env.GIT_COMMIT || 'local-dev',
    };

    // Calculate SHA256 checksum of the snapshot content
    const hash = crypto.createHash('sha256');
    // Exclude the sha256 property itself when calculating the hash
    hash.update(JSON.stringify(rawSnapshot));
    rawSnapshot.sha256 = hash.digest('hex');

    return rawSnapshot;
  }
}

module.exports = CompilerOutput;
