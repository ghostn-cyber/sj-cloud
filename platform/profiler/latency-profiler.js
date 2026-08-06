class LatencyProfiler {
  constructor() {
    this.totalRequests = 0;
    this.totalDurationMs = 0;
  }

  recordRequest(durationMs) {
    this.totalRequests++;
    this.totalDurationMs += durationMs;
  }

  getLatency() {
    const average = this.totalRequests > 0 ? (this.totalDurationMs / this.totalRequests) : 15; // default 15ms
    return {
      averageRequestDurationMs: average,
      totalRequestsTracked: this.totalRequests
    };
  }
}

const globalLatencyProfiler = new LatencyProfiler();

module.exports = {
  LatencyProfiler,
  globalLatencyProfiler
};
