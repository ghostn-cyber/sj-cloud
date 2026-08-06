const os = require('os');

class LogCollector {
  enrich(entry) {
    return {
      ...entry,
      node: os.hostname(),
      pid: process.pid,
      env: process.env.NODE_ENV || 'development'
    };
  }
}

const globalLogCollector = new LogCollector();

module.exports = {
  LogCollector,
  globalLogCollector
};
