const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class TenantVersion {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  createVersionSnapshot(tenantId, config) {
    const versionsDir = path.join(this.tenantsDir, tenantId, 'versions');
    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir, { recursive: true });
    }

    const versionNum = Date.now();
    const backupPath = path.join(versionsDir, `tenant-${versionNum}.yaml`);
    fs.writeFileSync(backupPath, yaml.dump(config), 'utf8');

    const ledgerPath = path.join(versionsDir, 'versions-ledger.json');
    let ledger = [];
    if (fs.existsSync(ledgerPath)) {
      try {
        ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
      } catch {}
    }
    ledger.push({
      version: versionNum,
      timestamp: new Date().toISOString(),
      file: `tenant-${versionNum}.yaml`
    });
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
    return versionNum;
  }

  getVersions(tenantId) {
    const ledgerPath = path.join(this.tenantsDir, tenantId, 'versions', 'versions-ledger.json');
    if (!fs.existsSync(ledgerPath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch {
      return [];
    }
  }

  rollbackTo(tenantId, versionNum) {
    const versionsDir = path.join(this.tenantsDir, tenantId, 'versions');
    const backupPath = path.join(versionsDir, `tenant-${versionNum}.yaml`);
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Version snapshot not found: ${versionNum}`);
    }

    const configContent = fs.readFileSync(backupPath, 'utf8');
    const tenantYamlPath = path.join(this.tenantsDir, tenantId, 'tenant.yaml');
    fs.writeFileSync(tenantYamlPath, configContent, 'utf8');
    return yaml.load(configContent);
  }
}

module.exports = {
  TenantVersion
};
