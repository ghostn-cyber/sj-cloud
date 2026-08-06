const { SecretRotation } = require('./secret-rotation');
const { globalSecretManager } = require('./secret-manager');

class RotationEngine {
  constructor(secretManager) {
    this.secretManager = secretManager || globalSecretManager;
    this.rotator = new SecretRotation(this.secretManager);
    this.schedules = new Map();
    this.timers = new Map();
  }

  register(tenantId, secretName, intervalMs) {
    const key = `${tenantId}:${secretName}`;
    this.schedules.set(key, intervalMs);
    if (this.timers.has(key)) {
      clearInterval(this.timers.get(key));
    }
    const timer = setInterval(() => {
      this.rotate(tenantId, secretName).catch(err => {
        console.error(`Scheduled rotation failed for ${key}:`, err.message);
      });
    }, intervalMs);
    this.timers.set(key, timer);
  }

  async rotate(tenantId, secretName) {
    return this.rotator.rotate(tenantId, secretName);
  }

  stopAll() {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}

const globalRotationEngine = new RotationEngine();
module.exports = { RotationEngine, globalRotationEngine };
