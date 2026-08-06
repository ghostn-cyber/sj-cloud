const fs = require('fs');
const path = require('path');
const { globalSecretEncryption } = require('./secret-encryption');

class SecretVersionManager {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  _getVersionsPath(tenantId) {
    return path.join(this.tenantsDir, tenantId, 'secrets', 'versions.json');
  }

  saveVersion(tenantId, secretName, value) {
    const versionsPath = this._getVersionsPath(tenantId);
    const dir = path.dirname(versionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const history = fs.existsSync(versionsPath) ? JSON.parse(fs.readFileSync(versionsPath, 'utf8')) : {};
    if (!history[secretName]) {
      history[secretName] = [];
    }

    const encrypted = globalSecretEncryption.encrypt(value);

    history[secretName].push({
      version: history[secretName].length + 1,
      timestamp: new Date().toISOString(),
      value: encrypted
    });

    fs.writeFileSync(versionsPath, JSON.stringify(history, null, 2), 'utf8');
  }

  getVersions(tenantId, secretName) {
    const versionsPath = this._getVersionsPath(tenantId);
    if (!fs.existsSync(versionsPath)) return [];
    const history = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
    const list = history[secretName] || [];
    return list.map(item => ({
      version: item.version,
      timestamp: item.timestamp,
      value: globalSecretEncryption.decrypt(item.value)
    }));
  }

  rollback(tenantId, secretName, targetVersion) {
    const versions = this.getVersions(tenantId, secretName);
    const match = versions.find(v => v.version === targetVersion);
    if (!match) throw new Error(`Version ${targetVersion} not found for secret ${secretName}`);
    return match.value;
  }
}

const globalSecretVersionManager = new SecretVersionManager();
module.exports = { SecretVersionManager, globalSecretVersionManager };
