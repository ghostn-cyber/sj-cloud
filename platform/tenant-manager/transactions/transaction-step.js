const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { globalTenantRegistry } = require('../registry/tenant-registry');

class TransactionStep {
  constructor(name) {
    this.name = name;
  }

  async execute(context) {
    throw new Error('Not implemented');
  }

  async compensate(context) {
    throw new Error('Not implemented');
  }
}

class WorkspaceStep extends TransactionStep {
  constructor(workspaceCreator) {
    super('Workspace Creation');
    this.workspaceCreator = workspaceCreator;
  }

  async execute(context) {
    context.workspaceDir = this.workspaceCreator.create(context.tenantId);
  }

  async compensate(context) {
    this.workspaceCreator.destroy(context.tenantId);
  }
}

class VolumeStep extends TransactionStep {
  constructor(volumeCreator) {
    super('Volume Creation');
    this.volumeCreator = volumeCreator;
  }

  async execute(context) {
    this.volumeCreator.create(context.tenantId);
  }

  async compensate(context) {
    // Cleaned up when WorkspaceStep rolls back WorkspaceCreator.destroy()
  }
}

class SecretStep extends TransactionStep {
  constructor(secretGenerator) {
    super('Secret Generation');
    this.secretGenerator = secretGenerator;
  }

  async execute(context) {
    context.secrets = this.secretGenerator.generate(context.tenantId);
  }

  async compensate(context) {
    this.secretGenerator.destroy(context.tenantId);
  }
}

class DatabaseStep extends TransactionStep {
  constructor() {
    super('Database Provisioning');
  }

  async execute(context) {
    const tenantId = context.tenantId;
    const dbName = `sj_tenant_${tenantId.replace(/-/g, '_')}`;
    const dbUser = `sj_user_${tenantId.replace(/-/g, '_')}`;
    const dbPassword = context.secrets.db_password;

    context.dbName = dbName;
    context.dbUser = dbUser;

    try {
      execSync('which psql', { stdio: 'ignore' });
    } catch {
      console.log('ℹ️ psql CLI not found. Skipping local database creation queries.');
      return;
    }

    const { DatabaseConfig, SecurityConfig } = require('../../shared/config/config-context');
    const host = DatabaseConfig.POSTGRES_HOST || 'localhost';
    const adminUser = 'postgres';
    const adminPass = SecurityConfig.POSTGRES_PASSWORD || 'postgres';

    const createRoleCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "CREATE ROLE ${dbUser} WITH LOGIN PASSWORD '${dbPassword}';"`;
    const createDbCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "CREATE DATABASE ${dbName} OWNER ${dbUser};"`;
    const grantCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`;

    execSync(createRoleCmd, { stdio: 'ignore' });
    execSync(createDbCmd, { stdio: 'ignore' });
    execSync(grantCmd, { stdio: 'ignore' });
  }

  async compensate(context) {
    if (!context.dbName || !context.dbUser) return;
    try {
      execSync('which psql', { stdio: 'ignore' });
    } catch {
      return;
    }

    const { DatabaseConfig, SecurityConfig } = require('../../shared/config/config-context');
    const host = DatabaseConfig.POSTGRES_HOST || 'localhost';
    const adminUser = 'postgres';
    const adminPass = SecurityConfig.POSTGRES_PASSWORD || 'postgres';

    try {
      const dropDbCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "DROP DATABASE IF EXISTS ${context.dbName};"`;
      const dropRoleCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "DROP ROLE IF EXISTS ${context.dbUser};"`;
      execSync(dropDbCmd, { stdio: 'ignore' });
      execSync(dropRoleCmd, { stdio: 'ignore' });
    } catch (err) {
      console.error('Failed to compensate database provisioning:', err.message);
    }
  }
}

class EnvironmentStep extends TransactionStep {
  constructor(environmentBuilder) {
    super('Environment Setup');
    this.environmentBuilder = environmentBuilder;
  }

  async execute(context) {
    const tenantId = context.tenantId;
    const params = context.params;
    const dbName = context.dbName || `sj_tenant_${tenantId.replace(/-/g, '_')}`;
    const dbUser = context.dbUser || `sj_user_${tenantId.replace(/-/g, '_')}`;

    const env = this.environmentBuilder.build({
      tenant_id: tenantId,
      slug: params.slug || tenantId,
      display_name: params.display_name || tenantId,
      status: 'PROVISIONING',
      plan: params.plan || 'standard',
      primary_domain: params.primary_domain || `${tenantId}.sj-cloud.test`,
      custom_domains: params.custom_domains || [],
      environment: params.environment || 'development',
      region: params.region || 'local',
      database_host: require('../../shared/config/config-context').DatabaseConfig.POSTGRES_HOST || 'localhost',
      database_port: require('../../shared/config/config-context').DatabaseConfig.POSTGRES_PORT || '5432',
      database_name: dbName,
      database_username: dbUser,
      database_password: context.secrets.db_password,
      jwt_secret: context.secrets.jwt_secret,
      encryption_key: context.secrets.encryption_key
    });

    globalTenantRegistry.saveTenant(env, false);
    context.env = env;
  }

  async compensate(context) {
    globalTenantRegistry.deleteTenant(context.tenantId);
  }
}

class ComposeStep extends TransactionStep {
  constructor(containerGenerator) {
    super('Compose Generation');
    this.containerGenerator = containerGenerator;
  }

  async execute(context) {
    const tenantId = context.tenantId;
    const dbName = context.dbName || `sj_tenant_${tenantId.replace(/-/g, '_')}`;
    const dbUser = context.dbUser || `sj_user_${tenantId.replace(/-/g, '_')}`;

    this.containerGenerator.generate(tenantId, {
      NODE_ENV: context.env.environment,
      DATABASE_HOST: 'sj-postgres',
      DATABASE_PORT: 5432,
      DATABASE_NAME: dbName,
      DATABASE_USER: dbUser,
      DATABASE_PASSWORD: context.secrets.db_password,
      JWT_SECRET: context.secrets.jwt_secret
    });
  }

  async compensate(context) {
    if (context.workspaceDir) {
      const composeFile = path.join(context.workspaceDir, 'docker-compose.yml');
      if (fs.existsSync(composeFile)) {
        fs.unlinkSync(composeFile);
      }
    }
  }
}

class DnsStep extends TransactionStep {
  constructor(dnsGenerator) {
    super('DNS & Routing Setup');
    this.dnsGenerator = dnsGenerator;
  }

  async execute(context) {
    const primaryDomain = context.params.primary_domain || `${context.tenantId}.sj-cloud.test`;
    const customDomains = context.params.custom_domains || [];
    this.dnsGenerator.generate(context.tenantId, primaryDomain, customDomains);
  }

  async compensate(context) {
    this.dnsGenerator.destroy(context.tenantId);
  }
}

class CertificateStep extends TransactionStep {
  constructor(certificateGenerator) {
    super('Certificate Generation');
    this.certificateGenerator = certificateGenerator;
  }

  async execute(context) {
    const primaryDomain = context.params.primary_domain || `${context.tenantId}.sj-cloud.test`;
    this.certificateGenerator.generate(context.tenantId, primaryDomain);
  }

  async compensate(context) {
    this.certificateGenerator.destroy(context.tenantId);
  }
}

class ContainerStep extends TransactionStep {
  constructor(provisioner) {
    super('Container Startup');
    this.provisioner = provisioner;
  }

  async execute(context) {
    this.provisioner.startTenantContainer(context.tenantId);
  }

  async compensate(context) {
    this.provisioner.stopTenantContainer(context.tenantId);
  }
}

class HealthStep extends TransactionStep {
  constructor(healthVerifier) {
    super('Health Verification');
    this.healthVerifier = healthVerifier;
  }

  async execute(context) {
    const primaryDomain = context.params.primary_domain || `${context.tenantId}.sj-cloud.test`;
    try {
      await this.healthVerifier.verify(primaryDomain, 3, 200);
    } catch (err) {
      console.warn(`Health check warning: ${err.message}. Continuing execution.`);
    }
  }

  async compensate(context) {
    // Health verification has no side-effects, nothing to compensate.
  }
}

module.exports = {
  TransactionStep,
  WorkspaceStep,
  VolumeStep,
  SecretStep,
  DatabaseStep,
  EnvironmentStep,
  ComposeStep,
  DnsStep,
  CertificateStep,
  ContainerStep,
  HealthStep
};
