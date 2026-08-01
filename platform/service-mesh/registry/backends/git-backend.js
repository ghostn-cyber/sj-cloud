const RegistryBackend = require('./backend-interface');

class GitBackend extends RegistryBackend {
  async loadRawConfigs() {
    throw new Error('GitBackend: Method not implemented');
  }
}

module.exports = GitBackend;
