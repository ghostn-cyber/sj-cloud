const { globalSecretEncryption } = require('./secret-encryption');

class SecretProvider {
  constructor() {
    this.localStore = new Map();
  }

  getSecret(key) {
    if (this.localStore.has(key)) {
      const encrypted = this.localStore.get(key);
      return globalSecretEncryption.decrypt(encrypted);
    }
    return null;
  }

  setSecret(key, val) {
    const encrypted = globalSecretEncryption.encrypt(val);
    this.localStore.set(key, encrypted);
  }

  deleteSecret(key) {
    this.localStore.delete(key);
  }
}

module.exports = {
  SecretProvider
};
