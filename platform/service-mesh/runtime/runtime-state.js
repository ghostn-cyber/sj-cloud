const os = require('os');

class RuntimeState {
  constructor(version = '1.0.0') {
    this.version = version;
    this.startedAt = Date.now();
  }

  getUptime() {
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  getDetails() {
    return {
      version: this.version,
      uptime: this.getUptime(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      loadAvg: os.loadavg()
    };
  }
}

module.exports = RuntimeState;
