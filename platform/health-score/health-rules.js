class HealthRules {
  getPenalties() {
    let activeCriticalIncidents = 0;
    let warningAlerts = 0;
    let pipelineFailures = 0;
    let highCpu = false;

    // 1. Evaluate incidents
    try {
      const { globalIncidentManager } = require('../incidents/incident-manager');
      const activeIncidents = globalIncidentManager.getAllIncidents().filter(i => i.state !== 'CLOSED' && i.state !== 'RESOLVED');
      activeCriticalIncidents = activeIncidents.filter(i => i.severity === 'CRITICAL').length;
    } catch (e) {}

    // 2. Evaluate alerts
    try {
      const { globalAlertEngine } = require('../alerts/alert-engine');
      warningAlerts = globalAlertEngine.getHistory().length;
    } catch (e) {}

    // 3. Evaluate CPU
    try {
      const { globalCapacityManager } = require('../capacity/capacity-manager');
      const cap = globalCapacityManager.getCapacityForecast();
      if (cap.cpu > 80) highCpu = true;
    } catch (e) {}

    let totalPenalty = 0;
    totalPenalty += activeCriticalIncidents * 30;
    totalPenalty += warningAlerts * 5;
    totalPenalty += pipelineFailures * 10;
    if (highCpu) totalPenalty += 15;

    return totalPenalty;
  }
}

const globalHealthRules = new HealthRules();

module.exports = {
  HealthRules,
  globalHealthRules
};
