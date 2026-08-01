const fs = require('fs');
const path = require('path');

class ReleaseHistory {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  getAppDir(tenantId, appId) {
    return path.join(this.tenantsDir, tenantId, 'apps', appId);
  }

  getReleases(tenantId, appId) {
    const appDir = this.getAppDir(tenantId, appId);
    const ledgerPath = path.join(appDir, 'releases.json');
    if (!fs.existsSync(ledgerPath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch {
      return [];
    }
  }

  record(tenantId, appId, release) {
    const appDir = this.getAppDir(tenantId, appId);
    const ledgerPath = path.join(appDir, 'releases.json');
    const ledgerDir = path.dirname(ledgerPath);
    if (!fs.existsSync(ledgerDir)) {
      fs.mkdirSync(ledgerDir, { recursive: true });
    }

    const releases = this.getReleases(tenantId, appId);
    releases.push(release);
    fs.writeFileSync(ledgerPath, JSON.stringify(releases, null, 2), 'utf8');
  }
}

module.exports = { ReleaseHistory };
