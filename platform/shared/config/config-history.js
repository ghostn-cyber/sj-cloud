const schema = require('./config-schema');

class ConfigHistory {
  constructor() {
    this.records = [];
    this.version = 1;
  }

  record(config, previousRedacted = null) {
    const redacted = {};
    for (const key of Object.keys(config)) {
      if (schema[key] && schema[key].secret) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = config[key];
      }
    }

    const changes = [];
    if (previousRedacted) {
      for (const key of Object.keys(redacted)) {
        if (JSON.stringify(redacted[key]) !== JSON.stringify(previousRedacted[key])) {
          changes.push({
            key,
            from: previousRedacted[key],
            to: redacted[key]
          });
        }
      }
    }

    const entry = {
      timestamp: new Date().toISOString(),
      version: this.version++,
      changes,
      config: redacted
    };

    this.records.push(entry);
    if (this.records.length > 50) {
      this.records.shift();
    }
  }

  getHistory() {
    return this.records;
  }

  getCurrentVersion() {
    return this.version - 1;
  }
}

const globalConfigHistory = new ConfigHistory();

module.exports = {
  ConfigHistory,
  globalConfigHistory
};
