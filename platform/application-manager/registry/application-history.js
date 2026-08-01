const fs = require('fs');
const path = require('path');

class ApplicationHistory {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  getAppDir(tenantId, appId) {
    return path.join(this.tenantsDir, tenantId, 'apps', appId);
  }

  getHistory(tenantId, appId) {
    const appDir = this.getAppDir(tenantId, appId);
    const historyPath = path.join(appDir, 'history.json');
    if (!fs.existsSync(historyPath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch {
      return [];
    }
  }

  recordEvent(tenantId, appId, action, status, details = {}) {
    const appDir = this.getAppDir(tenantId, appId);
    const historyPath = path.join(appDir, 'history.json');
    const historyDir = path.dirname(historyPath);
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    const history = this.getHistory(tenantId, appId);
    history.push({
      timestamp: new Date().toISOString(),
      action,
      status,
      details
    });

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
  }
}

module.exports = {
  ApplicationHistory
};
