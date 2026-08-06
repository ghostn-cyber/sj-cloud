const { globalEventBus } = require('../service-mesh/events');

class WebhookEvents {
  static emit(type, eventId, tenantId, details = {}) {
    globalEventBus.publish(type, {
      timestamp: new Date().toISOString(),
      tenant: tenantId,
      application: details.applicationId || details.application || null,
      repository: details.repositoryId || details.repository || null,
      pipeline: details.pipelineId || details.pipeline || null,
      correlationID: details.correlationId || details.correlationID || `corr-${Math.random().toString(36).substr(2, 9)}`,
      traceparent: details.traceparent || null,
      severity: details.severity || 'INFO',
      eventId,
      details,
      timestamp_epoch: Date.now()
    });
  }
}

module.exports = {
  WebhookEvents
};
