const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class TenantStatus {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  getDockerStatus(tenantId) {
    const composePath = path.join(this.tenantsDir, tenantId, 'docker-compose.yml');
    if (!fs.existsSync(composePath)) {
      return 'NOT_DEPLOYED';
    }
    try {
      const output = execSync('docker compose ps --format json', { cwd: path.dirname(composePath), stdio: 'pipe' }).toString();
      if (!output.trim()) {
        return 'STOPPED';
      }
      if (output.toLowerCase().includes('"state":"running"') || output.toLowerCase().includes('"status":"running"')) {
        return 'RUNNING';
      }
      return 'STOPPED';
    } catch {
      return 'UNKNOWN';
    }
  }

  getSummary(cache) {
    const tenants = cache.getAll();
    const summary = {
      total: tenants.length,
      active: 0,
      suspended: 0,
      failed: 0,
      archived: 0,
      provisioning: 0,
      other: 0
    };

    for (const t of tenants) {
      switch (t.status) {
        case 'ACTIVE':
          summary.active++;
          break;
        case 'SUSPENDED':
          summary.suspended++;
          break;
        case 'FAILED':
          summary.failed++;
          break;
        case 'ARCHIVED':
          summary.archived++;
          break;
        case 'PROVISIONING':
          summary.provisioning++;
          break;
        default:
          summary.other++;
          break;
      }
    }
    return summary;
  }
}

module.exports = {
  TenantStatus
};
