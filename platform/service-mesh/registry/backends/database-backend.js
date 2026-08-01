const RegistryBackend = require('./backend-interface');

class DatabaseBackend extends RegistryBackend {
  async loadRawConfigs() {
    throw new Error('DatabaseBackend: Method not implemented');
  }
}

module.exports = DatabaseBackend;
