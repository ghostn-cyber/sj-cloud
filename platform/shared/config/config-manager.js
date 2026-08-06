const configLoader = require('./config-loader');
const configValidator = require('./config-validator');
const { globalConfigCache } = require('./config-cache');
const globalConfigEvents = require('./config-events');
const { globalConfigHistory } = require('./config-history');
const schema = require('./config-schema');

let reloadCount = 0;
let errorCount = 0;

class ConfigManager {
  constructor() {
    this.loaded = false;
  }

  load(runtimeOverrides = {}) {
    try {
      const raw = configLoader.load(runtimeOverrides);
      configValidator.validate(raw);
      
      const previous = globalConfigCache.get();
      const previousRedacted = previous ? this.redact(previous) : null;
      
      globalConfigCache.set(raw);
      globalConfigHistory.record(raw, previousRedacted);
      
      this.runtimeOverrides = runtimeOverrides;
      this.loaded = true;
      return raw;
    } catch (err) {
      errorCount++;
      globalConfigEvents.emit('error', err);
      throw err;
    }
  }

  reload(runtimeOverrides = {}) {
    reloadCount++;
    try {
      const raw = this.load(runtimeOverrides);
      globalConfigEvents.emit('reload', raw);
      return raw;
    } catch (err) {
      throw err;
    }
  }

  get(key) {
    if (!this.loaded) this.load();
    const config = globalConfigCache.get();
    return config ? config[key] : undefined;
  }

  getAll() {
    if (!this.loaded) this.load();
    return globalConfigCache.get();
  }

  redact(config) {
    if (!config) return {};
    const redacted = {};
    for (const key of Object.keys(config)) {
      if (schema[key] && schema[key].secret) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = config[key];
      }
    }
    return redacted;
  }

  getRedacted() {
    const config = this.getAll();
    return this.redact(config);
  }

  getMetrics() {
    const config = this.getAll();
    return {
      sj_platform_config_reload_total: reloadCount,
      sj_platform_config_errors_total: errorCount,
      sj_platform_environment: config ? config.PLATFORM_ENV : 'unknown',
      sj_platform_domain: config ? config.PLATFORM_BASE_DOMAIN : 'unknown',
      sj_platform_region: config ? config.PLATFORM_REGION : 'unknown',
      sj_platform_configuration_version: globalConfigHistory.getCurrentVersion()
    };
  }
}

const globalConfigManager = new ConfigManager();

try {
  globalConfigManager.load();
} catch (e) {
  // Gracefully handle load failure on startup if config is not fully set up yet
}

module.exports = globalConfigManager;
