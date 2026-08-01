const RegistryBackend = require('./backend-interface');

class RemoteAPIBackend extends RegistryBackend {
  async loadRawConfigs() {
    throw new Error('RemoteAPIBackend: Method not implemented');
  }
}

module.exports = RemoteAPIBackend;
