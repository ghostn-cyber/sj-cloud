const RegistryBackend = require('./backend-interface');

class KubernetesBackend extends RegistryBackend {
  async loadRawConfigs() {
    throw new Error('KubernetesBackend: Method not implemented');
  }
}

module.exports = KubernetesBackend;
