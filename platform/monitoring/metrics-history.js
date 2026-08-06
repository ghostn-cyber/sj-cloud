class MetricsHistory {
  constructor(maxSize = 1000) {
    this.history = [];
    this.maxSize = maxSize;
  }

  record(metricsSnapshot) {
    this.history.push({
      timestamp: new Date().toISOString(),
      metrics: metricsSnapshot
    });

    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  getHistory() {
    return this.history;
  }
}

const globalMetricsHistory = new MetricsHistory();

module.exports = {
  MetricsHistory,
  globalMetricsHistory
};
