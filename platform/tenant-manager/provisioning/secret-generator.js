const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { LifecycleError } = require('../../shared/errors');

class SecretGenerator {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  generate(tenantId) {
    const secrets = {
      jwt_secret: crypto.randomBytes(32).toString('hex'),
      encryption_key: crypto.randomBytes(32).toString('hex'),
      api_secret: crypto.randomBytes(24).toString('base64'),
      db_password: crypto.randomBytes(16).toString('hex'),
      storage_credentials: {
        access_key: crypto.randomBytes(16).toString('hex'),
        secret_key: crypto.randomBytes(32).toString('hex')
      }
    };

    const secretsPath = path.join(this.tenantsDir, tenantId, 'secrets.json');
    try {
      fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2), 'utf8');
      return secrets;
    } catch (err) {
      throw new LifecycleError(`Failed to save secrets for tenant ${tenantId}: ${err.message}`, { rootCause: err });
    }
  }

  load(tenantId) {
    const secretsPath = path.join(this.tenantsDir, tenantId, 'secrets.json');
    if (!fs.existsSync(secretsPath)) {
      return null;
    }
    try {
      return JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    } catch (err) {
      throw new LifecycleError(`Failed to load secrets for tenant ${tenantId}: ${err.message}`, { rootCause: err });
    }
  }
}

module.exports = {
  SecretGenerator
};
