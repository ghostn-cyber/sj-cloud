class MetricsProvider {
  getMetrics(appId) {
    // Return mock CPU/Memory usage
    return {
      cpu: 45, // percent
      memory: 60, // percent
      timestamp: Date.now()
    };
  }
}

const metricsProvider = new MetricsProvider();

module.exports = {
  MetricsProvider,
  metricsProvider
};
