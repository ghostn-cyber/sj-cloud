const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Provisioner } = require('../provisioning/provisioner');
const { TenantEvents } = require('../registry/tenant-events');
const { globalTenantRegistry } = require('../registry/tenant-registry');

class Recovery {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.provisioner = new Provisioner(this.tenantsDir);
  }

  async recover(tenantId, reason) {
    console.log(`[Recovery] Attempting recovery for tenant: ${tenantId} due to: ${reason}`);
    const tenantDir = path.join(this.tenantsDir, tenantId);
    const tenant = globalTenantRegistry.getTenant(tenantId);
    
    if (!tenant) {
      console.warn(`[Recovery] No tenant found in registry for ${tenantId}. Skipping.`);
      return false;
    }

    try {
      if (reason === 'containers_stopped') {
        execSync('docker compose up -d', { cwd: tenantDir, stdio: 'ignore' });
        TenantEvents.emit('TENANT_RECOVERED', tenantId, { action: 'restart_containers' });
        return true;
      }

      if (reason === 'compose_file_missing') {
        const secrets = this.provisioner.secretGenerator.load(tenantId) || this.provisioner.secretGenerator.generate(tenantId);
        const dbName = `sj_tenant_${tenantId.replace(/-/g, '_')}`;
        const dbUser = `sj_user_${tenantId.replace(/-/g, '_')}`;
        this.provisioner.containerGenerator.generate(tenantId, {
          NODE_ENV: tenant.environment || 'development',
          DATABASE_HOST: 'sj-postgres',
          DATABASE_PORT: 5432,
          DATABASE_NAME: dbName,
          DATABASE_USER: dbUser,
          DATABASE_PASSWORD: secrets.db_password,
          JWT_SECRET: secrets.jwt_secret
        });
        execSync('docker compose up -d', { cwd: tenantDir, stdio: 'ignore' });
        TenantEvents.emit('TENANT_RECOVERED', tenantId, { action: 'recreate_compose' });
        return true;
      }

      if (reason === 'routing_file_missing') {
        const primaryDomain = tenant.primary_domain || `${tenantId}.platform.test`;
        const customDomains = tenant.custom_domains || [];
        this.provisioner.dnsGenerator.generate(tenantId, primaryDomain, customDomains);
        TenantEvents.emit('TENANT_RECOVERED', tenantId, { action: 'recreate_route' });
        return true;
      }

      if (reason === 'certificate_unhealthy') {
        const primaryDomain = tenant.primary_domain || `${tenantId}.platform.test`;
        this.provisioner.certificateGenerator.generate(tenantId, primaryDomain);
        TenantEvents.emit('TENANT_RECOVERED', tenantId, { action: 'reissue_certificate' });
        return true;
      }

      if (reason === 'database_missing') {
        const secrets = this.provisioner.secretGenerator.load(tenantId) || this.provisioner.secretGenerator.generate(tenantId);
        const dbName = `sj_tenant_${tenantId.replace(/-/g, '_')}`;
        const dbUser = `sj_user_${tenantId.replace(/-/g, '_')}`;
        
        const host = process.env.PGHOST || 'localhost';
        const adminUser = process.env.PGUSER || 'postgres';
        const adminPass = process.env.PGPASSWORD || 'postgres';

        const createRoleCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "CREATE ROLE ${dbUser} WITH LOGIN PASSWORD '${secrets.db_password}';"`;
        const createDbCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "CREATE DATABASE ${dbName} OWNER ${dbUser};"`;
        const grantCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`;

        execSync(createRoleCmd, { stdio: 'ignore' });
        execSync(createDbCmd, { stdio: 'ignore' });
        execSync(grantCmd, { stdio: 'ignore' });

        TenantEvents.emit('TENANT_RECOVERED', tenantId, { action: 'recreate_database' });
        return true;
      }
    } catch (err) {
      console.error(`[Recovery] Failed to recover tenant ${tenantId} for ${reason}:`, err.message);
      TenantEvents.emit('TENANT_RECONCILE_FAILED', tenantId, { action: 'recovery_failed', error: err.message });
    }

    return false;
  }
}

module.exports = { Recovery };
