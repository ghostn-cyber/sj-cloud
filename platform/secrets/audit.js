const fs = require('fs');
const path = require('path');

class SecretAudit {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  logAccess(tenantId, secretName, action, user = 'system', details = {}) {
    const auditDir = path.join(this.tenantsDir, tenantId, 'secrets');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    const auditPath = path.join(auditDir, 'audit.log');
    const entry = {
      timestamp: new Date().toISOString(),
      tenantId,
      secretName,
      action,
      user,
      details: { ...details, value: undefined } // Mask secret values
    };
    fs.appendFileSync(auditPath, JSON.stringify(entry) + '\n', 'utf8');
  }

  getAuditLogs(tenantId) {
    const auditPath = path.join(this.tenantsDir, tenantId, 'secrets', 'audit.log');
    if (!fs.existsSync(auditPath)) return [];
    const content = fs.readFileSync(auditPath, 'utf8').trim();
    if (!content) return [];
    return content.split('\n').map(line => JSON.parse(line));
  }
}

const globalSecretAudit = new SecretAudit();
module.exports = { SecretAudit, globalSecretAudit };
