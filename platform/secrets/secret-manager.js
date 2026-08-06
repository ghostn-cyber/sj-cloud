const fs = require('fs');
const path = require('path');
const { SecretProvider } = require('./secret-provider');
const { SecretHistory } = require('./secret-history');
const { SecretEvents } = require('./secret-events');
const { globalSecretAudit } = require('./audit');
const { globalSecretValidator } = require('./validator');
const { globalSecretVersionManager } = require('./version-manager');

class SecretManager {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.provider = new SecretProvider();
    this.history = new SecretHistory(this.tenantsDir);
    this.initialize();
  }

  initialize() {
    this.reload();
  }

  _getStorePath(tenantId) {
    return path.join(this.tenantsDir, tenantId, 'secrets', 'secrets.json');
  }

  reload() {
    if (!fs.existsSync(this.tenantsDir)) return;
    const tenants = fs.readdirSync(this.tenantsDir);
    for (const tenantId of tenants) {
      const storePath = this._getStorePath(tenantId);
      if (fs.existsSync(storePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(storePath, 'utf8'));
          for (const [key, val] of Object.entries(content)) {
            this.provider.localStore.set(`${tenantId}:${key}`, val);
          }
        } catch (err) {
          console.error(`Failed to load secrets for tenant ${tenantId}:`, err.message);
        }
      }
    }
  }

  _getStoreKey(name, scope, scopeId) {
    if (scope === 'tenant') return name;
    return `${scope}:${scopeId || 'default'}:${name}`;
  }

  saveSecret(tenantId, name, value, scope = 'tenant', scopeId = null, user = 'system') {
    const check = globalSecretValidator.validateSecret(name, value);
    if (!check.valid) {
      throw new Error(`Validation failed for secret ${name}: ${check.error}`);
    }

    const key = this._getStoreKey(name, scope, scopeId);
    this.provider.setSecret(`${tenantId}:${key}`, value);

    const storePath = this._getStorePath(tenantId);
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const store = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, 'utf8')) : {};
    store[key] = this.provider.localStore.get(`${tenantId}:${key}`);
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');

    globalSecretVersionManager.saveVersion(tenantId, key, value);
    globalSecretAudit.logAccess(tenantId, name, 'SECRET_WRITE', user, { scope, scopeId });
    this.history.log(tenantId, name, 'SECRET_SAVED', { scope, scopeId });
    SecretEvents.emit('SecretSaved', name, tenantId, { scope, scopeId });
    return true;
  }

  getSecret(tenantId, name, scope = 'tenant', scopeId = null, user = 'system') {
    const key = this._getStoreKey(name, scope, scopeId);
    const secret = this.provider.getSecret(`${tenantId}:${key}`);
    globalSecretAudit.logAccess(tenantId, name, 'SECRET_READ', user, { scope, scopeId, success: !!secret });
    this.history.log(tenantId, name, 'SECRET_READ', { scope, scopeId });
    return secret;
  }

  deleteSecret(tenantId, name, scope = 'tenant', scopeId = null, user = 'system') {
    const key = this._getStoreKey(name, scope, scopeId);
    this.provider.deleteSecret(`${tenantId}:${key}`);

    const storePath = this._getStorePath(tenantId);
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (store[key]) {
        delete store[key];
        fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
      }
    }

    globalSecretAudit.logAccess(tenantId, name, 'SECRET_DELETE', user, { scope, scopeId });
    this.history.log(tenantId, name, 'SECRET_DELETED', { scope, scopeId });
    SecretEvents.emit('SecretDeleted', name, tenantId, { scope, scopeId });
    return true;
  }

  rollbackSecret(tenantId, name, version, scope = 'tenant', scopeId = null, user = 'system') {
    const key = this._getStoreKey(name, scope, scopeId);
    const rolledBackValue = globalSecretVersionManager.rollback(tenantId, key, version);
    this.saveSecret(tenantId, name, rolledBackValue, scope, scopeId, user);
    globalSecretAudit.logAccess(tenantId, name, 'SECRET_ROLLBACK', user, { scope, scopeId, targetVersion: version });
    return true;
  }

  getSecretVersions(tenantId, name, scope = 'tenant', scopeId = null) {
    const key = this._getStoreKey(name, scope, scopeId);
    return globalSecretVersionManager.getVersions(tenantId, key);
  }

  getSecretKeys(tenantId) {
    const storePath = this._getStorePath(tenantId);
    if (!fs.existsSync(storePath)) return [];
    try {
      return Object.keys(JSON.parse(fs.readFileSync(storePath, 'utf8')));
    } catch {
      return [];
    }
  }
}

const globalSecretManager = new SecretManager();

module.exports = {
  SecretManager,
  globalSecretManager
};
