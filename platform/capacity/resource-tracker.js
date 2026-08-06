class ResourceTracker {
  getCurrentWorkloads() {
    let tenantsCount = 0;
    let appsCount = 0;
    let pipelineRuns = 0;

    try {
      const { globalTenantRegistry } = require('../tenant-manager/registry/tenant-registry');
      tenantsCount = globalTenantRegistry.getAllTenants().length;
    } catch (e) {}

    try {
      const { globalApplicationRegistry } = require('../application-manager/registry/application-registry');
      appsCount = globalApplicationRegistry.getAllApplications().length;
    } catch (e) {}

    try {
      const { PipelineFSM } = require('../pipeline-engine/pipeline-fsm');
      pipelineRuns = PipelineFSM.getMetrics().pipeline_runs_total || 0;
    } catch (e) {}

    return {
      tenants: tenantsCount,
      applications: appsCount,
      activePipelines: pipelineRuns,
      containers: appsCount * 2,
      buildWorkers: 2 // emulated build worker limits
    };
  }
}

const globalResourceTracker = new ResourceTracker();

module.exports = {
  ResourceTracker,
  globalResourceTracker
};
