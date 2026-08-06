const { globalRuntimeInspector } = require('./runtime-inspector');
const { globalNetworkInspector } = require('./network-inspector');
const { globalMeshInspector } = require('./mesh-inspector');
const { globalTenantInspector } = require('./tenant-inspector');
const { globalApplicationInspector } = require('./application-inspector');
const { globalDeploymentInspector } = require('./deployment-inspector');
const { globalPipelineInspector } = require('./pipeline-inspector');
const { globalStorageInspector } = require('./storage-inspector');

class DiagnosticsManager {
  runFullDiagnostics() {
    return {
      timestamp: new Date().toISOString(),
      overallStatus: 'HEALTHY',
      runtime: globalRuntimeInspector.inspect(),
      network: globalNetworkInspector.inspect(),
      mesh: globalMeshInspector.inspect(),
      tenants: globalTenantInspector.inspect(),
      applications: globalApplicationInspector.inspect(),
      deployments: globalDeploymentInspector.inspect(),
      pipelines: globalPipelineInspector.inspect(),
      storage: globalStorageInspector.inspect()
    };
  }

  getRuntime() { return globalRuntimeInspector.inspect(); }
  getNetwork() { return globalNetworkInspector.inspect(); }
  getMesh() { return globalMeshInspector.inspect(); }
  getTenants() { return globalTenantInspector.inspect(); }
  getApplications() { return globalApplicationInspector.inspect(); }
  getDeployments() { return globalDeploymentInspector.inspect(); }
  getPipelines() { return globalPipelineInspector.inspect(); }
  getStorage() { return globalStorageInspector.inspect(); }
}

const globalDiagnosticsManager = new DiagnosticsManager();

module.exports = {
  DiagnosticsManager,
  globalDiagnosticsManager
};
