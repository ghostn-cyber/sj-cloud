const { globalCpuProfiler } = require('./cpu-profiler');
const { globalMemoryProfiler } = require('./memory-profiler');
const { globalEventLoopProfiler } = require('./eventloop-profiler');
const { globalLatencyProfiler } = require('./latency-profiler');

class Profiler {
  getProfile() {
    return {
      timestamp: new Date().toISOString(),
      cpu: globalCpuProfiler.getCPU(),
      memory: globalMemoryProfiler.getMemory(),
      eventLoop: globalEventLoopProfiler.getLag(),
      latency: globalLatencyProfiler.getLatency()
    };
  }
}

const globalProfiler = new Profiler();

module.exports = {
  Profiler,
  globalProfiler
};
