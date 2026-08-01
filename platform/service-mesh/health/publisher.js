const { globalEventDispatcher } = require('../events');

class HealthPublisher {
  static publishTransition(serviceId, oldStatus, newStatus) {
    globalEventDispatcher.dispatchHealthChanged(serviceId, oldStatus, newStatus);
  }
}

module.exports = HealthPublisher;
