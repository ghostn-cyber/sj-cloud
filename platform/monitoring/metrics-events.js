const { globalEventBus } = require('../service-mesh/events/event-bus');

class MetricsEvents {
  emitMetricExported(metricsCount) {
    globalEventBus.publish('METRIC_EXPORTED', {
      metricsCount,
      timestamp: Date.now()
    });
  }
}

const globalMetricsEvents = new MetricsEvents();

module.exports = {
  MetricsEvents,
  globalMetricsEvents
};
