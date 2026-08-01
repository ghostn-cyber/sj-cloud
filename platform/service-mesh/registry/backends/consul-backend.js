const RegistryBackend = require('./backend-interface');

class ConsulBackend extends RegistryBackend {
  async loadRawConfigs() {
    throw new Error('ConsulBackend: Method not implemented');
  }
}

module.exports = ConsulBackend;
