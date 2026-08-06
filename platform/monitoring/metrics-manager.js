const { globalMetricsRegistry } = require('./metrics-registry');
const { globalMetricsStorage } = require('./metrics-storage');
const { globalMetricsValidator } = require('./metrics-validator');
const { globalMetricsExporter } = require('./metrics-exporter');
const { globalMetricsCollector } = require('./metrics-collector');
const { globalMetricsHistory } = require('./metrics-history');
const { globalMetricsEvents } = require('./metrics-events');

class MetricsManager {
  setMetric(name, value, labels = {}) {
    const def = globalMetricsRegistry.getDefinition(name);
    globalMetricsValidator.validate(def, value, labels);
    globalMetricsStorage.set(name, value, labels);
  }

  incrementMetric(name, amount = 1, labels = {}) {
    const def = globalMetricsRegistry.getDefinition(name);
    const tempVal = (globalMetricsStorage.get(name, labels)?.value || 0) + amount;
    globalMetricsValidator.validate(def, tempVal, labels);
    globalMetricsStorage.increment(name, amount, labels);
  }

  getPrometheusFormat() {
    globalMetricsCollector.collectAll();
    const snapshot = globalMetricsStorage.getAll();
    globalMetricsHistory.record(snapshot);
    const output = globalMetricsExporter.exportPrometheus();
    globalMetricsEvents.emitMetricExported(snapshot.length);
    return output;
  }

  getHistory() {
    return globalMetricsHistory.getHistory();
  }
}

const globalMetricsManager = new MetricsManager();

module.exports = {
  MetricsManager,
  globalMetricsManager
};
