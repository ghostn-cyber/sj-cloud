const { globalEventBus } = require('../service-mesh/events');

class PolicyEvents {
  static emit(type, ruleName, target, result, details = {}) {
    globalEventBus.publish(type, {
      timestamp: new Date().toISOString(),
      ruleName,
      target,
      result,
      details,
      timestamp_epoch: Date.now()
    });
  }
}

module.exports = { PolicyEvents };
