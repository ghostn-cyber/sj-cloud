const { TraceContext } = require('./trace-context');
const { SpanBuilder } = require('./span-builder');
const { globalSpanManager } = require('./span-manager');
const { globalTraceStorage } = require('./trace-storage');
const { globalTraceExporter } = require('./trace-exporter');
const { globalTraceHistory } = require('./trace-history');

class TraceManager {
  startSpan(name, traceParentHeader = null) {
    let traceId;
    let parentSpanId = null;

    if (traceParentHeader) {
      const parsed = TraceContext.parseTraceParent(traceParentHeader);
      if (parsed) {
        traceId = parsed.traceId;
        parentSpanId = parsed.spanId;
      }
    }

    if (!traceId) {
      traceId = TraceContext.generateTraceId();
    }

    const builder = new SpanBuilder(globalSpanManager, name, traceId, parentSpanId);
    return builder;
  }

  getTrace(traceId) {
    return globalTraceStorage.getTrace(traceId);
  }

  getAllTraces() {
    return globalTraceExporter.exportAll();
  }

  getHistory() {
    return globalTraceHistory.getHistory();
  }

  createTraceParent(traceId, spanId) {
    return TraceContext.formatTraceParent(traceId, spanId);
  }
}

const globalTraceManager = new TraceManager();

module.exports = {
  TraceManager,
  globalTraceManager
};
