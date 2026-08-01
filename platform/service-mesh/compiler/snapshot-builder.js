const crypto = require('crypto');

class SnapshotBuilder {
  static build(services, dependencyGraph, version = '1.0.0', buildNumber = 1) {
    const rawSnapshot = {
      services,
      compiledAt: new Date().toISOString(),
      version,
      buildNumber,
      compilerVersion: '1.0.0',
      registryVersion: '1.0.0',
      gitCommit: process.env.GIT_COMMIT || 'local-dev',
      dependencyGraph
    };

    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(rawSnapshot));
    rawSnapshot.sha256 = hash.digest('hex');

    return rawSnapshot;
  }
}

module.exports = SnapshotBuilder;
