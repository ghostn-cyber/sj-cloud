const { globalHealthManager } = require('../health/health-manager');

class RuntimeHealth {
  static async checkReadiness(appId, host, port, path, policy = {}) {
    return globalHealthManager.verifyReadiness(appId, host, port, path, policy);
  }
}

module.exports = { RuntimeHealth };
