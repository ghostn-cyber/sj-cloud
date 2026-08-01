const { ApplicationEvents } = require('../registry/application-events');

class RollbackEvents {
  static emitStarted(appId, tenantId, releaseId) {
    ApplicationEvents.emit('ROLLBACK_STARTED', appId, { tenantId, releaseId });
  }

  static emitCompleted(appId, tenantId, releaseId) {
    ApplicationEvents.emit('ROLLBACK_COMPLETED', appId, { tenantId, releaseId });
  }

  static emitFailed(appId, tenantId, releaseId, error) {
    ApplicationEvents.emit('ROLLBACK_FAILED', appId, { tenantId, releaseId, error: error.message });
  }
}

module.exports = { RollbackEvents };
