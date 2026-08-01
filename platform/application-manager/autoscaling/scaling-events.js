const { ApplicationEvents } = require('../registry/application-events');

class ScalingEvents {
  static emitScalingEvent(appId, oldReplicas, newReplicas, reason) {
    ApplicationEvents.emit('APPLICATION_SCALED', appId, {
      oldReplicas,
      newReplicas,
      reason
    });
  }
}

module.exports = { ScalingEvents };
