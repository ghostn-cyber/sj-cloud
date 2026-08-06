class CapacityForecast {
  forecast(currentMetrics) {
    // Basic forecasting based on active counts
    const cpuEstimated = Math.min(10 + (currentMetrics.applications * 5) + (currentMetrics.activePipelines * 10), 100);
    const memoryEstimated = Math.min(25 + (currentMetrics.applications * 8), 100);
    const diskEstimated = Math.min(12 + (currentMetrics.tenants * 4), 100);

    return {
      cpu: cpuEstimated,
      memory: memoryEstimated,
      disk: diskEstimated,
      daysToLimit: cpuEstimated > 80 || memoryEstimated > 80 ? 14 : 90
    };
  }
}

const globalCapacityForecast = new CapacityForecast();

module.exports = {
  CapacityForecast,
  globalCapacityForecast
};
