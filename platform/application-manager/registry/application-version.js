const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ApplicationVersion {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  getAppDir(tenantId, appId) {
    return path.join(this.tenantsDir, tenantId, 'apps', appId);
  }

  createVersionSnapshot(tenantId, appId, config) {
    const appDir = this.getAppDir(tenantId, appId);
    const versionsDir = path.join(appDir, 'versions');
    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir, { recursive: true });
    }

    const versionNum = Date.now();
    const backupPath = path.join(versionsDir, `app-${versionNum}.yaml`);
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
      file: `app-${versionNum}.yaml`
    });
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
    return versionNum;
  }

  getVersions(tenantId, appId) {
    const appDir = this.getAppDir(tenantId, appId);
    const ledgerPath = path.join(appDir, 'versions', 'versions-ledger.json');
    if (!fs.existsSync(ledgerPath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch {
      return [];
    }
  }

  rollbackTo(tenantId, appId, versionNum) {
    const appDir = this.getAppDir(tenantId, appId);
    const versionsDir = path.join(appDir, 'versions');
    const backupPath = path.join(versionsDir, `app-${versionNum}.yaml`);
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Application version snapshot not found: ${versionNum}`);
    }

    const configContent = fs.readFileSync(backupPath, 'utf8');
    const appYamlPath = path.join(appDir, 'application.yaml');
    fs.writeFileSync(appYamlPath, configContent, 'utf8');
    return yaml.load(configContent);
  }
}

module.exports = {
  ApplicationVersion
};
