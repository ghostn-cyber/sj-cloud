const HealthAggregator = require('./aggregator');
const HealthScheduler = require('./scheduler');

class HealthMonitor {
  constructor(serviceConfigs, checkIntervalMs = 5000) {
    this.aggregator = new HealthAggregator();
    this.scheduler = new HealthScheduler(this.aggregator, checkIntervalMs);
    this.scheduler.updateConfigs(serviceConfigs);
    this.statuses = this.aggregator.statuses;
  }

  updateConfigs(newConfigs) {
    this.scheduler.updateConfigs(newConfigs);
  }

  start() {
    this.scheduler.start();
  }

  stop() {
    this.scheduler.stop();
  }

  getStatus(serviceId) {
    return this.aggregator.getStatus(serviceId);
  }

  getAllStatuses() {
    return this.aggregator.getAllStatuses();
  }
}

module.exports = {
  HealthMonitor
};
