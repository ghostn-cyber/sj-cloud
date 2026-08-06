const { globalInventoryManager } = require('../inventory/inventory-manager');

class DriftDetector {
  detectDrift() {
    const current = globalInventoryManager.discover();
    const expectedServices = ['postgres', 'redis', 'minio', 'registry-api', 'mesh-proxy'];
    const expectedNetworks = ['sj-edge', 'sj-proxy', 'sj-control-plane', 'sj-services', 'sj-data', 'sj-monitoring', 'sj-observability', 'sj-backup', 'sj-build', 'sj-ci'];

    const missingServices = expectedServices.filter(s => !current.services.includes(s));
    const missingNetworks = expectedNetworks.filter(n => !current.networks.includes(n));

    const hasDrift = missingServices.length > 0 || missingNetworks.length > 0;

    return {
      timestamp: new Date().toISOString(),
      hasDrift,
      drifts: {
        missingServices,
        missingNetworks
      }
    };
  }
}

const globalDriftDetector = new DriftDetector();
module.exports = { DriftDetector, globalDriftDetector };
