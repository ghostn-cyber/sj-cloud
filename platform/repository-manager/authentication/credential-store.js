const fs = require('fs');
const path = require('path');
const { globalSecretEncryption } = require('../../secrets/secret-encryption');

class CredentialStore {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  _getStorePath(tenantId) {
    return path.join(this.tenantsDir, tenantId, 'credentials.json');
  }

  saveCredential(tenantId, repoId, credentials) {
    const storePath = this._getStorePath(tenantId);
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const store = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, 'utf8')) : {};
    
    // Encrypt token
    const encryptedCreds = { ...credentials };
    if (credentials.token) {
      encryptedCreds.token = globalSecretEncryption.encrypt(credentials.token);
    }
    if (credentials.password) {
      encryptedCreds.password = globalSecretEncryption.encrypt(credentials.password);
    }
    store[repoId] = encryptedCreds;
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    return true;
  }

  getCredential(tenantId, repoId) {
    const storePath = this._getStorePath(tenantId);
    if (!fs.existsSync(storePath)) return {};
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const credentials = store[repoId] || {};
    const decryptedCreds = { ...credentials };
    if (credentials.token) {
      decryptedCreds.token = globalSecretEncryption.decrypt(credentials.token);
    }
    if (credentials.password) {
      decryptedCreds.password = globalSecretEncryption.decrypt(credentials.password);
    }
    return decryptedCreds;
  }

  deleteCredential(tenantId, repoId) {
    const storePath = this._getStorePath(tenantId);
    if (!fs.existsSync(storePath)) return false;
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (store[repoId]) {
      delete store[repoId];
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
      return true;
    }
    return false;
  }
}

const globalCredentialStore = new CredentialStore();

module.exports = {
  CredentialStore,
  globalCredentialStore
};
