const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const recoveryMetrics = {
  runtime_recovery_total: 0
};

class RuntimeRecovery {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  async recover(tenantId, appId) {
    console.log(`[RuntimeRecovery] Triggering self-healing recovery for app: ${appId}...`);
    recoveryMetrics.runtime_recovery_total++;
    
    const appDir = path.join(this.tenantsDir, tenantId, 'apps', appId);
    if (!fs.existsSync(appDir)) {
      throw new Error(`Application directory not found for recovery: ${appDir}`);
    }

    try {
      execSync('docker compose restart', { cwd: appDir, stdio: 'pipe' });
      console.log(`[RuntimeRecovery] Application ${appId} successfully restarted.`);
      return true;
    } catch (err) {
      console.error(`[RuntimeRecovery] Recovery restart failed: ${err.message}`);
      return false;
    }
  }

  static getMetrics() {
    return recoveryMetrics;
  }
}

module.exports = {
  RuntimeRecovery,
  recoveryMetrics
};
