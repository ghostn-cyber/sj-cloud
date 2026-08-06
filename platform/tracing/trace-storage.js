class TraceStorage {
  constructor() {
    this.traces = new Map();
  }

  saveSpan(span) {
    let traceSpans = this.traces.get(span.traceId);
    if (!traceSpans) {
      traceSpans = [];
      this.traces.set(span.traceId, traceSpans);
    }
    traceSpans.push(span);
  }

  getTrace(traceId) {
    return this.traces.get(traceId) || [];
  }

  getAllTraces() {
    return Array.from(this.traces.entries()).map(([traceId, spans]) => ({
      traceId,
      spans
    }));
  }

  clear() {
    this.traces.clear();
  }
}

const globalTraceStorage = new TraceStorage();

module.exports = {
  TraceStorage,
  globalTraceStorage
};
