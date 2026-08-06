const { globalResourceTracker } = require('./resource-tracker');
const { globalCapacityForecast } = require('./capacity-forecast');
const { globalCapacityEvents } = require('./capacity-events');

class CapacityManager {
  getCapacityForecast() {
    const workloads = globalResourceTracker.getCurrentWorkloads();
    const forecast = globalCapacityForecast.forecast(workloads);
    
    const report = {
      timestamp: new Date().toISOString(),
      workloads,
      cpu: forecast.cpu,
      memory: forecast.memory,
      disk: forecast.disk,
      daysToLimit: forecast.daysToLimit
    };

    globalCapacityEvents.emitCapacityEvaluated(report);
    return report;
  }
}

const globalCapacityManager = new CapacityManager();

module.exports = {
  CapacityManager,
  globalCapacityManager
};
