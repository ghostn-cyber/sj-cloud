class TraceHistory {
  constructor(maxSize = 500) {
    this.buffer = [];
    this.maxSize = maxSize;
  }

  recordTrace(trace) {
    this.buffer.push(trace);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getHistory() {
    return this.buffer;
  }
}

const globalTraceHistory = new TraceHistory();

module.exports = {
  TraceHistory,
  globalTraceHistory
};
