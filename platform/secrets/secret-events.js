const { globalEventBus } = require('../service-mesh/events');

class SecretEvents {
  static emit(type, secretName, tenantId, details = {}) {
    globalEventBus.publish(type, {
      timestamp: new Date().toISOString(),
      tenant: tenantId,
      application: details.applicationId || details.application || null,
      repository: details.repositoryId || details.repository || null,
      pipeline: details.pipelineId || details.pipeline || null,
      correlationID: details.correlationId || details.correlationID || `corr-${Math.random().toString(36).substr(2, 9)}`,
      traceparent: details.traceparent || null,
      severity: details.severity || 'INFO',
      secretName,
      details,
      timestamp_epoch: Date.now()
    });
  }
}

module.exports = {
  SecretEvents
};
