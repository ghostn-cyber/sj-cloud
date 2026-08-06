const fs = require('fs');
const path = require('path');

class QuotaManager {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  _getQuotaPath(tenantId) {
    return path.join(this.tenantsDir, tenantId, 'quota.json');
  }

  setQuota(tenantId, limits = {}) {
    const quotaPath = this._getQuotaPath(tenantId);
    const dir = path.dirname(quotaPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const quota = {
      tenantId,
      limits: {
        cpu: limits.cpu || '1.0',
        memory: limits.memory || '1G',
        storage: limits.storage || '10G',
        maxSecrets: limits.maxSecrets || 20,
        maxCertificates: limits.maxCertificates || 5
      }
    };
    fs.writeFileSync(quotaPath, JSON.stringify(quota, null, 2), 'utf8');
    return quota;
  }

  getQuota(tenantId) {
    const quotaPath = this._getQuotaPath(tenantId);
    if (!fs.existsSync(quotaPath)) {
      return this.setQuota(tenantId);
    }
    return JSON.parse(fs.readFileSync(quotaPath, 'utf8'));
  }

  checkQuota(tenantId, resourceType, currentUsage) {
    const quota = this.getQuota(tenantId);
    const limit = quota.limits[resourceType];
    if (limit === undefined) return { allowed: true };
    const allowed = currentUsage <= limit;
    return { allowed, currentUsage, limit };
  }
}

const globalQuotaManager = new QuotaManager();
module.exports = { QuotaManager, globalQuotaManager };
