const { HealthChecker } = require('./health-checker');
const { HealthPolicy } = require('./health-policy');
const { globalHealthHistory } = require('./health-history');
const { HealthError } = require('../../shared/errors');

class HealthManager {
  constructor() {
    this.checker = new HealthChecker();
  }

  async verifyReadiness(appId, host, port, path, policyOptions = {}) {
    const policy = new HealthPolicy(policyOptions);
    const initialDelay = policy.initialDelay;
    const interval = policy.interval;
    const maxThreshold = policy.threshold;

    console.log(`[HealthManager] Starting readiness check for ${appId} at http://${host}:${port}${path} (Initial delay: ${initialDelay}s)...`);
    
    await new Promise(resolve => setTimeout(resolve, initialDelay * 1000));

    let attempts = 0;
    while (attempts < maxThreshold * 2) {
      attempts++;
      console.log(`[HealthManager] Readiness attempt ${attempts} for ${appId}...`);
      
      // For validation testing when curl / local processes might not be fully bound,
      // we can do a local check or mock response if we get connection refused but container exists
      const result = await this.checker.checkHttp(host, port, path);
      
      globalHealthHistory.record(appId, 'readiness', result.status, { host, port, path, attempt: attempts, error: result.error });

      if (result.status === 'HEALTHY') {
        console.log(`[HealthManager] App ${appId} is READY!`);
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }

    throw new HealthError(`Readiness check failed for application: ${appId}`);
  }
}

const globalHealthManager = new HealthManager();

module.exports = {
  HealthManager,
  globalHealthManager
};
