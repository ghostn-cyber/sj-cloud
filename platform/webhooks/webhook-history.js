const fs = require('fs');
const path = require('path');

class WebhookHistory {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  log(tenantId, eventId, eventType, details) {
    const dir = path.join(this.tenantsDir, tenantId, 'webhooks');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const logPath = path.join(dir, 'history.log');
    const entry = {
      timestamp: new Date().toISOString(),
      eventId,
      eventType,
      details
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  }

  getHistory(tenantId) {
    const logPath = path.join(this.tenantsDir, tenantId, 'webhooks', 'history.log');
    if (!fs.existsSync(logPath)) return [];
    const content = fs.readFileSync(logPath, 'utf8').trim();
    if (!content) return [];
    return content.split('\n').map(line => JSON.parse(line));
  }
}

module.exports = {
  WebhookHistory
};
