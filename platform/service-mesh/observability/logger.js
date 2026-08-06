const { AsyncLocalStorage } = require('async_hooks');

const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let PlatformConfig;
try {
  PlatformConfig = require('../config/config-context').PlatformConfig;
} catch (e) {
  try {
    PlatformConfig = require('../../shared/config/config-context').PlatformConfig;
  } catch (err) {}
}

function getPlatformValue(key, fallback) {
  if (PlatformConfig) {
    try {
      return PlatformConfig[key] || fallback;
    } catch (e) {}
  }
  return process.env[key] || fallback;
}

function getCurrentLogLevel() {
  const levelStr = getPlatformValue('LOG_LEVEL', 'INFO');
  return LogLevels[levelStr.toUpperCase()] || LogLevels.INFO;
}

const logStorage = new AsyncLocalStorage();

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  log(levelName, message, meta = null) {
    const level = LogLevels[levelName];
    if (level < getCurrentLogLevel()) return;

    const store = logStorage.getStore() || {};

    const logObj = {
      timestamp: new Date().toISOString(),
      severity: levelName,
      service: getPlatformValue('SERVICE_ID', store.service || 'unknown'),
      tenant: store.tenantId || store.tenant || null,
      application: store.applicationId || store.application || null,
      deployment_id: store.deploymentId || store.deployment_id || null,
      pipeline_id: store.pipelineId || store.pipeline_id || null,
      release_id: store.releaseId || store.release_id || null,
      request_id: store.requestId || store.request_id || null,
      trace_id: store.traceId || store.trace_id || null,
      span_id: store.spanId || store.span_id || null,
      container: getPlatformValue('CONTAINER_NAME', store.container || null),
      host: getPlatformValue('HOSTNAME', store.host || 'localhost'),
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
  globalLogger,
  logStorage
};
