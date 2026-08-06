class MemoryProfiler {
  getMemory() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers || 0,
      heapUsedPercent: (usage.heapUsed / usage.heapTotal) * 100
    };
  }
}

const globalMemoryProfiler = new MemoryProfiler();

module.exports = {
  MemoryProfiler,
  globalMemoryProfiler
};
