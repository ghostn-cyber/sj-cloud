const os = require('os');

class RuntimeInspector {
  inspect() {
    return {
      status: 'OK',
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      processUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }
}

const globalRuntimeInspector = new RuntimeInspector();

module.exports = {
  RuntimeInspector,
  globalRuntimeInspector
};
