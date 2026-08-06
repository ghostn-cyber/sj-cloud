const fs = require('fs');
const path = require('path');

class RepositoryHistory {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  logHistory(tenantId, repositoryId, eventType, details) {
    const historyDir = path.join(this.tenantsDir, tenantId, 'repositories', repositoryId, 'history');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    const historyFile = path.join(historyDir, 'audit.log');
    const entry = {
      timestamp: new Date().toISOString(),
      eventType,
      details
    };
    fs.appendFileSync(historyFile, JSON.stringify(entry) + '\n', 'utf8');
  }

  getHistory(tenantId, repositoryId) {
    const historyFile = path.join(this.tenantsDir, tenantId, 'repositories', repositoryId, 'history', 'audit.log');
    if (!fs.existsSync(historyFile)) return [];
    const content = fs.readFileSync(historyFile, 'utf8').trim();
    if (!content) return [];
    return content.split('\n').map(line => JSON.parse(line));
  }
}

module.exports = {
  RepositoryHistory
};
