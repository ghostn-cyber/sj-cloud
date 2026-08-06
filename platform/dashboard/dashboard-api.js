const { globalDashboardSummary } = require('./dashboard-summary');
const { globalDashboardHealth } = require('./dashboard-health');
const { globalDashboardMetrics } = require('./dashboard-metrics');
const { globalDashboardEvents } = require('./dashboard-events');

class DashboardApi {
  getDashboardData() {
    return {
      timestamp: new Date().toISOString(),
      summary: globalDashboardSummary.getSummary(),
      health: globalDashboardHealth.getHealth(),
      metrics: globalDashboardMetrics.getMetrics(),
      events: globalDashboardEvents.getEvents()
    };
  }
}

const globalDashboardApi = new DashboardApi();

module.exports = {
  DashboardApi,
  globalDashboardApi
};
