class SecretValidator {
  validateSecret(secretName, value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'Secret value must be a non-empty string' };
    }
    if (secretName.includes('password') && value.length < 8) {
      return { valid: false, error: 'Password secrets must be at least 8 characters long' };
    }
    if (secretName.includes('key') && value.length < 16) {
      return { valid: false, error: 'Key secrets must be at least 16 characters long' };
    }
    return { valid: true };
  }

  validateTenantSecrets(tenantId, secretsMap, requiredSecretsList = []) {
    const missing = [];
    const invalid = {};

    for (const name of requiredSecretsList) {
      const val = secretsMap[name];
      if (!val) {
        missing.push(name);
      } else {
        const check = this.validateSecret(name, val);
        if (!check.valid) {
          invalid[name] = check.error;
        }
      }
    }

    return {
      valid: missing.length === 0 && Object.keys(invalid).length === 0,
      missing,
      invalid
    };
  }
}

const globalSecretValidator = new SecretValidator();
module.exports = { SecretValidator, globalSecretValidator };
