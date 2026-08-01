const RegistryBackend = require('./backend-interface');

class EtcdBackend extends RegistryBackend {
  async loadRawConfigs() {
    throw new Error('EtcdBackend: Method not implemented');
  }
}

module.exports = EtcdBackend;
