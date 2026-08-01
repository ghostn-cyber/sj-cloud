const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CurrentLevel = process.env.LOG_LEVEL 
  ? LogLevels[process.env.LOG_LEVEL.toUpperCase()] || LogLevels.INFO
  : LogLevels.INFO;

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  log(levelName, message, meta = null) {
    const level = LogLevels[levelName];
    if (level < CurrentLevel) return;

    const logObj = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message: this.prefix ? `${this.prefix} ${message}` : message
    };

    if (meta) {
      logObj.meta = meta;
    }

    const output = JSON.stringify(logObj);
    if (level >= LogLevels.ERROR) {
      console.error(output);
    } else if (level === LogLevels.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(msg, meta) { this.log('DEBUG', msg, meta); }
  info(msg, meta) { this.log('INFO', msg, meta); }
  warn(msg, meta) { this.log('WARN', msg, meta); }
  error(msg, meta) { this.log('ERROR', msg, meta); }
}

const globalLogger = new Logger('Mesh');

module.exports = {
  Logger,
  globalLogger
};
