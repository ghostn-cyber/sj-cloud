class DashboardMetrics {
  getMetrics() {
    let cpu = 15;
    let memory = 35;
    let disk = 48;

    try {
      const { globalCapacityManager } = require('../capacity/capacity-manager');
      const fc = globalCapacityManager.getCapacityForecast();
      cpu = fc.cpu;
      memory = fc.memory;
      disk = fc.disk;
    } catch (e) {}

    return {
      cpu: { value: cpu, unit: '%' },
      memory: { value: memory, unit: '%' },
      disk: { value: disk, unit: '%' }
    };
  }
}

const globalDashboardMetrics = new DashboardMetrics();

module.exports = {
  DashboardMetrics,
  globalDashboardMetrics
};
