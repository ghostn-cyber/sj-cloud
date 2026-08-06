const { globalTraceStorage } = require('./trace-storage');
const { globalEventBus } = require('../service-mesh/events/event-bus');

class SpanManager {
  recordSpan(span) {
    const rawSpan = {
      name: span.name,
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      startTime: span.startTime,
      endTime: span.endTime,
      duration: span.duration,
      attributes: span.attributes,
      status: span.status
    };

    globalTraceStorage.saveSpan(rawSpan);
    
    // Emit TRACE_CREATED event for new/completed traces
    globalEventBus.publish('TRACE_CREATED', {
      traceId: span.traceId,
      spanId: span.spanId,
      name: span.name,
      duration: span.duration,
      timestamp: Date.now()
    });
  }
}

const globalSpanManager = new SpanManager();

module.exports = {
  SpanManager,
  globalSpanManager
};
