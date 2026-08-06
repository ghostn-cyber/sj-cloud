const VALID_LEVELS = ['DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL'];
const VALID_SCOPES = ['service', 'tenant', 'application', 'request', 'pipeline', 'deployment', 'runtime', 'audit'];

class LogValidator {
  validate(entry) {
    if (!entry) throw new Error('Log entry cannot be empty');
    if (!VALID_LEVELS.includes(entry.level)) {
      throw new Error(`Invalid log level: ${entry.level}. Allowed: ${VALID_LEVELS.join(', ')}`);
    }
    if (!VALID_SCOPES.includes(entry.scope)) {
      throw new Error(`Invalid log scope: ${entry.scope}. Allowed: ${VALID_SCOPES.join(', ')}`);
    }
    if (!entry.message || typeof entry.message !== 'string') {
      throw new Error('Log entry message must be a non-empty string');
    }
    return true;
  }
}

const globalLogValidator = new LogValidator();

module.exports = {
  LogValidator,
  globalLogValidator,
  VALID_LEVELS,
  VALID_SCOPES
};
