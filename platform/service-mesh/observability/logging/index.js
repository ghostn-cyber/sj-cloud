const { Logger: BaseLogger } = require('../logger');

class Logger extends BaseLogger {
  log(levelName, message, meta = null) {
    const traceMeta = {};
    if (meta && meta.traceId) {
      traceMeta.traceId = meta.traceId;
    }
    
    // Support FATAL mapping
    const upperLevel = levelName ? levelName.toUpperCase() : 'INFO';
    super.log(upperLevel === 'FATAL' ? 'ERROR' : upperLevel, message, meta ? { ...traceMeta, ...meta } : meta);
  }

  fatal(msg, meta) {
    this.log('FATAL', msg, meta);
  }
}

const globalLogger = new Logger('Mesh');

module.exports = {
  Logger,
  globalLogger
};
