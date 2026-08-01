const crypto = require('crypto');

class SnapshotMetadata {
  static generate(services, version = '1.0.0', buildNumber = 1) {
    const data = {
      services,
      compiledAt: new Date().toISOString(),
      version,
      buildNumber,
      compilerVersion: '1.0.0',
      registryVersion: '1.0.0',
      gitCommit: process.env.GIT_COMMIT || 'local-dev',
    };

    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    data.sha256 = hash.digest('hex');

    return data;
  }
}

module.exports = SnapshotMetadata;
