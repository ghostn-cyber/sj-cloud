const fs = require('fs');
const path = require('path');

class AuditQuery {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  getTenantAudit(tenantId) {
    const auditPath = path.join(this.tenantsDir, tenantId, 'audit.json');
    if (!fs.existsSync(auditPath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    } catch {
      return [];
    }
  }

  queryAll(filter = {}) {
    const allLogs = [];
    if (!fs.existsSync(this.tenantsDir)) return [];
    
    const dirs = fs.readdirSync(this.tenantsDir);
    for (const tenantId of dirs) {
      const stats = fs.statSync(path.join(this.tenantsDir, tenantId));
      if (stats.isDirectory()) {
        const logs = this.getTenantAudit(tenantId);
        allLogs.push(...logs);
      }
    }

    // Sort by timestamp desc
    return allLogs
      .filter(log => {
        if (filter.action && log.action !== filter.action) return false;
        if (filter.tenantId && log.tenantId !== filter.tenantId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

module.exports = { AuditQuery };
