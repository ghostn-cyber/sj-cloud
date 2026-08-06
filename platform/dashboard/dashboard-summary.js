class DashboardSummary {
  getSummary() {
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

    try {
      const { globalAlertEngine } = require('../alerts/alert-engine');
      var alertCount = globalAlertEngine.getHistory().length;
    } catch (e) {
      var alertCount = 0;
    }

    try {
      const { globalIncidentManager } = require('../incidents/incident-manager');
      var activeIncidents = globalIncidentManager.getAllIncidents().filter(i => i.state !== 'CLOSED' && i.state !== 'RESOLVED').length;
    } catch (e) {
      var activeIncidents = 0;
    }

    return {
      tenantsCount,
      appsCount,
      pipelineRuns,
      alertsCount: alertCount,
      activeIncidentsCount: activeIncidents,
      containersCount: appsCount * 2 // emulated replica count
    };
  }
}

const globalDashboardSummary = new DashboardSummary();

module.exports = {
  DashboardSummary,
  globalDashboardSummary
};
