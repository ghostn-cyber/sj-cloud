const { globalEventBus } = require('../service-mesh/events');

class PipelineEvents {
  static emit(type, pipelineId, tenantId, details = {}) {
    globalEventBus.publish(type, {
      timestamp: new Date().toISOString(),
      tenant: tenantId,
      application: details.applicationId || details.application || null,
      repository: details.repositoryId || details.repository || null,
      pipeline: pipelineId,
      correlationID: details.correlationId || details.correlationID || `corr-${Math.random().toString(36).substr(2, 9)}`,
      traceparent: details.traceparent || null,
      severity: details.severity || 'INFO',
      details,
      timestamp_epoch: Date.now()
    });
  }
}

module.exports = {
  PipelineEvents
};
