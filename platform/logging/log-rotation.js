const path = require('path');
const { globalLogStorage } = require('./log-storage');
const { globalEventBus } = require('../service-mesh/events/event-bus');

class LogRotation {
  constructor(maxSizeBytes = 5 * 1024 * 1024) {
    this.maxSizeBytes = maxSizeBytes;
  }

  checkAndRotate() {
    const size = globalLogStorage.getFileSize();
    if (size >= this.maxSizeBytes) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(globalLogStorage.logDir, `platform.log.${timestamp}`);
      
      globalLogStorage.rotate(backupPath);

      globalEventBus.publish('LOG_ROTATED', {
        oldSize: size,
        backupPath,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }
}

const globalLogRotation = new LogRotation();

module.exports = {
  LogRotation,
  globalLogRotation
};
