const HealthChecker = require('./checker');
const HealthPublisher = require('./publisher');

class HealthScheduler {
  constructor(aggregator, intervalMs = 5000) {
    this.aggregator = aggregator;
    this.intervalMs = intervalMs;
    this.serviceConfigs = {};
    this.intervalId = null;
  }

  updateConfigs(newConfigs) {
    this.serviceConfigs = newConfigs;
    
    for (const serviceId of Object.keys(newConfigs)) {
      if (this.aggregator.getStatus(serviceId) === 'Unknown') {
        this.aggregator.updateServiceStatus(serviceId, 'Unknown');
      }
    }
    
    for (const serviceId of Object.keys(this.aggregator.getAllStatuses())) {
      if (!newConfigs[serviceId]) {
        this.aggregator.removeService(serviceId);
      }
    }
  }

  start() {
    if (this.intervalId) return;
    this.runChecks();
    this.intervalId = setInterval(() => this.runChecks(), this.intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async runChecks() {
    for (const [serviceId, config] of Object.entries(this.serviceConfigs)) {
      try {
        const newStatus = await HealthChecker.check(serviceId, config);
        const oldStatus = this.aggregator.updateServiceStatus(serviceId, newStatus);
        if (oldStatus !== newStatus) {
          HealthPublisher.publishTransition(serviceId, oldStatus, newStatus);
        }
      } catch (_) {}
    }
  }
}

module.exports = HealthScheduler;
