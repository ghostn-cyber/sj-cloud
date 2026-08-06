const { globalEventBus } = require('../service-mesh/events/event-bus');

class AlertEvents {
  emitAlertCreated(alert) {
    globalEventBus.publish('ALERT_CREATED', {
      alertId: alert.id,
      ruleId: alert.ruleId,
      title: alert.title,
      severity: alert.severity,
      timestamp: alert.timestamp
    });
  }
}

const globalAlertEvents = new AlertEvents();

module.exports = {
  AlertEvents,
  globalAlertEvents
};
