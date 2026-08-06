const { globalEventBus } = require('../service-mesh/events/event-bus');

class CapacityEvents {
  emitCapacityEvaluated(report) {
    globalEventBus.publish('CAPACITY_EVALUATED', {
      cpu: report.cpu,
      memory: report.memory,
      disk: report.disk,
      timestamp: Date.now()
    });
  }
}

const globalCapacityEvents = new CapacityEvents();

module.exports = {
  CapacityEvents,
  globalCapacityEvents
};
