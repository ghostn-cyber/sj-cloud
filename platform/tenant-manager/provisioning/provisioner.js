const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { WorkspaceCreator } = require('./workspace-creator');
const { VolumeCreator } = require('./volume-creator');
const { SecretGenerator } = require('./secret-generator');
const { DnsGenerator } = require('./dns-generator');
const { CertificateGenerator } = require('./certificate-generator');
const { ContainerGenerator } = require('./container-generator');
const { EnvironmentBuilder } = require('./environment-builder');
const { HealthVerifier } = require('./health-verifier');
const { RollbackManager } = require('./rollback-manager');
const { LifecycleFSM, TenantStates } = require('../lifecycle/lifecycle-fsm');
const { globalTenantRegistry } = require('../registry/tenant-registry');
const { LifecycleError } = require('../../shared/errors');
const { globalPolicyEngine } = require('../policies/policy-engine');
const { Transaction } = require('../transactions/transaction');
const { TransactionContext } = require('../transactions/transaction-context');
const { TransactionRunner } = require('../transactions/transaction-runner');
const {
  WorkspaceStep,
  SecretStep,
  DatabaseStep,
  EnvironmentStep,
  ComposeStep,
  DnsStep,
  CertificateStep,
  ContainerStep,
  HealthStep
} = require('../transactions/transaction-step');

class Provisioner {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
    this.workspaceCreator = new WorkspaceCreator(this.tenantsDir);
    this.volumeCreator = new VolumeCreator(this.tenantsDir);
    this.secretGenerator = new SecretGenerator(this.tenantsDir);
    this.dnsGenerator = new DnsGenerator();
    this.certificateGenerator = new CertificateGenerator();
    this.containerGenerator = new ContainerGenerator(this.tenantsDir);
    this.environmentBuilder = new EnvironmentBuilder();
    this.healthVerifier = new HealthVerifier();
  }

  async provision(tenantId, params = {}) {
    const startTime = Date.now();
    const fsm = new LifecycleFSM(tenantId, TenantStates.CREATING);

    try {
      console.log(`🚀 Starting provisioning for tenant: ${tenantId}`);

      // 1. Evaluate policies first
      globalPolicyEngine.evaluate('provision', tenantId, params);

      fsm.transitionTo(TenantStates.PROVISIONING);

      const context = new TransactionContext(tenantId, params);
      const transaction = new Transaction()
        .addStep(new WorkspaceStep(this.workspaceCreator))
        .addStep(new SecretStep(this.secretGenerator))
        .addStep(new DatabaseStep())
        .addStep(new EnvironmentStep(this.environmentBuilder))
        .addStep(new ComposeStep(this.containerGenerator))
        .addStep(new DnsStep(this.dnsGenerator))
        .addStep(new CertificateStep(this.certificateGenerator))
        .addStep(new ContainerStep(this))
        .addStep(new HealthStep(this.healthVerifier));

      await TransactionRunner.run(transaction, context);

      fsm.transitionTo(TenantStates.STARTING);

      context.env.status = 'ACTIVE';
      globalTenantRegistry.saveTenant(context.env, true);
      fsm.transitionTo(TenantStates.ACTIVE);

      const duration = Date.now() - startTime;
      LifecycleFSM.recordProvisionTime(duration);
      console.log(`✅ Tenant ${tenantId} successfully provisioned in ${duration}ms!`);
      return context.env;
    } catch (err) {
      console.error(`❌ Provisioning failed for tenant ${tenantId}:`, err.message);
      fsm.transitionTo(TenantStates.FAILED);
      LifecycleFSM.recordRollback();
      throw err;
    }
  }

  async provisionDatabase(dbName, dbUser, dbPassword, rollbackManager) {
    try {
      const host = process.env.PGHOST || 'localhost';
      const adminUser = process.env.PGUSER || 'postgres';
      const adminPass = process.env.PGPASSWORD || 'postgres';

      try {
        execSync('which psql', { stdio: 'ignore' });
      } catch {
        console.log('ℹ️ psql CLI not found. Skipping local database creation queries.');
        return;
      }

      const createRoleCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "CREATE ROLE ${dbUser} WITH LOGIN PASSWORD '${dbPassword}';"`;
      const createDbCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "CREATE DATABASE ${dbName} OWNER ${dbUser};"`;
      const grantCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`;

      execSync(createRoleCmd, { stdio: 'ignore' });
      execSync(createDbCmd, { stdio: 'ignore' });
      execSync(grantCmd, { stdio: 'ignore' });

      rollbackManager.addTask('Drop Database and Role', () => {
        try {
          const dropDbCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "DROP DATABASE IF EXISTS ${dbName};"`;
          const dropRoleCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -c "DROP ROLE IF EXISTS ${dbUser};"`;
          execSync(dropDbCmd, { stdio: 'ignore' });
          execSync(dropRoleCmd, { stdio: 'ignore' });
        } catch (dbErr) {
          console.error('Failed to rollback database:', dbErr.message);
        }
      });
    } catch (err) {
      console.warn('⚠️ Database creation query failed. Continuing mock db setup.');
    }
  }

  startTenantContainer(tenantId) {
    const tenantDir = path.join(this.tenantsDir, tenantId);
    try {
      execSync('docker compose up -d', { cwd: tenantDir, stdio: 'ignore' });
    } catch (err) {
      console.warn(`⚠️ Failed to start docker-compose container for ${tenantId}. Running in offline/mock environment.`);
    }
  }

  stopTenantContainer(tenantId) {
    const tenantDir = path.join(this.tenantsDir, tenantId);
    try {
      execSync('docker compose down -v', { cwd: tenantDir, stdio: 'ignore' });
    } catch (err) {
      // Ignored
    }
  }
}

module.exports = {
  Provisioner
};
