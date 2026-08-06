const { globalTraceStorage } = require('./trace-storage');

class TraceExporter {
  exportAll() {
    return globalTraceStorage.getAllTraces();
  }

  exportTrace(traceId) {
    return globalTraceStorage.getTrace(traceId);
  }
}

const globalTraceExporter = new TraceExporter();

module.exports = {
  TraceExporter,
  globalTraceExporter
};
