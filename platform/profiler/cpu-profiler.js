class CpuProfiler {
  constructor() {
    this.lastUsage = process.cpuUsage();
    this.lastTime = Date.now();
  }

  getCPU() {
    const nextUsage = process.cpuUsage();
    const nextTime = Date.now();
    const userDiff = nextUsage.user - this.lastUsage.user;
    const sysDiff = nextUsage.system - this.lastUsage.system;
    const timeDiffMs = nextTime - this.lastTime;

    this.lastUsage = nextUsage;
    this.lastTime = nextTime;

    if (timeDiffMs === 0) return { usagePercentage: 0 };

    const totalUsageMicro = userDiff + sysDiff;
    const totalTimeMicro = timeDiffMs * 1000;
    const percentage = (totalUsageMicro / totalTimeMicro) * 100;

    return {
      usagePercentage: Math.min(percentage, 100),
      user: userDiff,
      system: sysDiff
    };
  }
}

const globalCpuProfiler = new CpuProfiler();

module.exports = {
  CpuProfiler,
  globalCpuProfiler
};
