const { ApplicationEvents } = require('../registry/application-events');

class ReleaseEvents {
  static emitCreated(appId, tenantId, releaseId) {
    ApplicationEvents.emit('RELEASE_CREATED', appId, { tenantId, releaseId });
  }

  static emitArchived(appId, tenantId, releaseId) {
    ApplicationEvents.emit('RELEASE_ARCHIVED', appId, { tenantId, releaseId });
  }
}

module.exports = { ReleaseEvents };
