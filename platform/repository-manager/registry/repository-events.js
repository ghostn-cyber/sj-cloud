const { globalEventBus } = require('../../service-mesh/events');

class RepositoryEvents {
  static emit(type, repoId, tenantId, details = {}) {
    globalEventBus.publish(type, {
      timestamp: new Date().toISOString(),
      tenant: tenantId,
      application: details.applicationId || details.application || null,
      repository: repoId,
      pipeline: details.pipelineId || details.pipeline || null,
      correlationID: details.correlationId || details.correlationID || `corr-${Math.random().toString(36).substr(2, 9)}`,
      traceparent: details.traceparent || null,
      severity: details.severity || 'INFO',
      details,
      timestamp_epoch: Date.now()
    });
  }
}

module.exports = {
  RepositoryEvents
};
