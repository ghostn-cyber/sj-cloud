class HealthAggregator {
  constructor() {
    this.statuses = {};
  }

  updateServiceStatus(serviceId, status) {
    const oldStatus = this.statuses[serviceId] || 'Unknown';
    this.statuses[serviceId] = status;
    return oldStatus;
  }

  getStatus(serviceId) {
    return this.statuses[serviceId] || 'Unknown';
  }

  getAllStatuses() {
    return this.statuses;
  }

  removeService(serviceId) {
    delete this.statuses[serviceId];
  }
}

module.exports = HealthAggregator;
