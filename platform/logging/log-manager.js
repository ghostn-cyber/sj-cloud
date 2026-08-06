const { globalLogValidator } = require('./log-validator');
const { globalLogCollector } = require('./log-collector');
const { globalLogWriter } = require('./log-writer');
const { globalLogRotation } = require('./log-rotation');
const { globalLogSearch } = require('./log-search');
const { globalLogHistory } = require('./log-history');

class LogManager {
  log(level, scope, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      scope,
      message,
      tenantId: context.tenantId || null,
      appId: context.appId || null,
      service: context.service || null,
      metadata: context.metadata || {}
    };

    globalLogValidator.validate(entry);
    const enriched = globalLogCollector.enrich(entry);
    globalLogWriter.write(enriched);

    globalLogRotation.checkAndRotate();

    return enriched;
  }

  debug(scope, message, context) { return this.log('DEBUG', scope, message, context); }
  info(scope, message, context) { return this.log('INFO', scope, message, context); }
  notice(scope, message, context) { return this.log('NOTICE', scope, message, context); }
  warn(scope, message, context) { return this.log('WARNING', scope, message, context); }
  error(scope, message, context) { return this.log('ERROR', scope, message, context); }
  critical(scope, message, context) { return this.log('CRITICAL', scope, message, context); }

  search(criteria) {
    return globalLogSearch.search(criteria);
  }

  getRecent() {
    return globalLogHistory.getRecent();
  }
}

const globalLogManager = new LogManager();

module.exports = {
  LogManager,
  globalLogManager
};
