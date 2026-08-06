const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { RotationPolicy } = require('./rotation-policy');
const { RotationHistory } = require('./rotation-history');
const { globalTenantRegistry } = require('../registry/tenant-registry');
const { TenantEvents } = require('../registry/tenant-events');
const { Provisioner } = require('../provisioning/provisioner');

const rotationMetrics = {
  tenant_secret_rotations: 0
};

class SecretRotation {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.policy = new RotationPolicy();
    this.history = new RotationHistory(this.tenantsDir);
    this.provisioner = new Provisioner(this.tenantsDir);
  }

  async rotateSecret(tenantId, type) {
    console.log(`[SecretRotation] Rotating secret of type "${type}" for tenant: ${tenantId}...`);
    const tenant = globalTenantRegistry.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

    const secretsPath = path.join(this.tenantsDir, tenantId, 'secrets.json');
    if (!fs.existsSync(secretsPath)) {
      throw new Error(`Secrets file not found for tenant: ${tenantId}`);
    }

    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    const oldPassword = secrets.db_password;
    
    let rotated = false;
    if (type === 'jwt') {
      secrets.jwt_secret = crypto.randomBytes(32).toString('hex');
      rotated = true;
    } else if (type === 'db') {
      const newPassword = crypto.randomBytes(16).toString('hex');
      secrets.db_password = newPassword;

      // Execute PG Alter command if psql is present
      const dbUser = `sj_user_${tenantId.replace(/-/g, '_')}`;
      try {
        execSync('which psql', { stdio: 'ignore' });
        const { DatabaseConfig, SecurityConfig } = require('../../shared/config/config-context');
        const host = DatabaseConfig.POSTGRES_HOST || 'localhost';
        const adminUser = 'postgres'; // psql admin username is postgres
        const adminPass = SecurityConfig.POSTGRES_PASSWORD || 'postgres';
        const alterCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "ALTER ROLE ${dbUser} WITH PASSWORD '${newPassword}';"`;
        execSync(alterCmd, { stdio: 'ignore' });
      } catch (err) {
        console.warn('⚠️ Could not update DB password via psql. Mocking rotation.');
      }

      // Re-build compose config environment
      const dbName = `sj_tenant_${tenantId.replace(/-/g, '_')}`;
      this.provisioner.containerGenerator.generate(tenantId, {
        NODE_ENV: tenant.environment,
        DATABASE_HOST: 'sj-postgres',
        DATABASE_PORT: 5432,
        DATABASE_NAME: dbName,
        DATABASE_USER: dbUser,
        DATABASE_PASSWORD: newPassword,
        JWT_SECRET: secrets.jwt_secret
      });

      // Update tenant registry environment
      tenant.database_password = newPassword;
      globalTenantRegistry.saveTenant(tenant, false);
      rotated = true;
    } else if (type === 'encryption_key') {
      secrets.encryption_key = crypto.randomBytes(32).toString('hex');
      rotated = true;
    }

    if (rotated) {
      fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2), 'utf8');
      this.history.recordRotation(tenantId, type);
      rotationMetrics.tenant_secret_rotations++;
      
      TenantEvents.emit('TENANT_SECRET_ROTATED', tenantId, { secretType: type });
      console.log(`[SecretRotation] Successfully rotated "${type}" secret for ${tenantId}`);
      return secrets;
    }

    throw new Error(`Unsupported secret rotation type: ${type}`);
  }

  static getMetrics() {
    return rotationMetrics;
  }
}

module.exports = {
  SecretRotation,
  rotationMetrics
};
