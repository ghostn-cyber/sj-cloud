const fs = require('fs');
const path = require('path');
const { AuditLog } = require('./audit-log');

class AuditWriter {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  write(tenantId, logData) {
    const auditLog = new AuditLog({ tenantId, ...logData });
    const tenantDir = path.join(this.tenantsDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const auditPath = path.join(tenantDir, 'audit.json');
    let logs = [];
    if (fs.existsSync(auditPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
      } catch {
        logs = [];
      }
    }

    logs.push(auditLog.toJSON());
    fs.writeFileSync(auditPath, JSON.stringify(logs, null, 2), 'utf8');
    return auditLog;
  }
}

module.exports = { AuditWriter };
