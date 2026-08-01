const fs = require('fs');
const path = require('path');

class TenantHistory {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  getHistory(tenantId) {
    const historyPath = path.join(this.tenantsDir, tenantId, 'history.json');
    if (!fs.existsSync(historyPath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch {
      return [];
    }
  }

  recordEvent(tenantId, action, status, details = {}) {
    const historyPath = path.join(this.tenantsDir, tenantId, 'history.json');
    const historyDir = path.dirname(historyPath);
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    const history = this.getHistory(tenantId);
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
  TenantHistory
};
