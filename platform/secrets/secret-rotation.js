const { SecretEvents } = require('./secret-events');

class SecretRotation {
  constructor(secretManager) {
    this.secretManager = secretManager;
  }

  async rotate(tenantId, secretName, scope = 'tenant', scopeId = null) {
    const original = this.secretManager.getSecret(tenantId, secretName, scope, scopeId);
    if (!original) throw new Error(`Secret not found: ${secretName}`);

    // Generate new rotated dummy key
    const rotatedValue = `rotated_${Math.random().toString(36).substr(2, 10)}`;
    this.secretManager.saveSecret(tenantId, secretName, rotatedValue, scope, scopeId);

    SecretEvents.emit('SecretRotated', secretName, tenantId, { scope, scopeId });
    return { success: true, rotatedAt: new Date().toISOString() };
  }
}

module.exports = {
  SecretRotation
};
