const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { DesiredState } = require('./desired-state');
const { ActualState } = require('./actual-state');
const { TenantDiff } = require('./tenant-diff');
const { Provisioner } = require('../provisioning/provisioner');
const { TenantEvents } = require('../registry/tenant-events');

class TenantReconciler {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.provisioner = new Provisioner(this.tenantsDir);
    this.actualStateChecker = new ActualState(this.tenantsDir);
  }

  async reconcile(tenantId) {
    const desired = DesiredState.get(tenantId);
    const actual = this.actualStateChecker.get(tenantId);
    const drifts = TenantDiff.compare(desired, actual);

    if (drifts.length === 0) {
      return { success: true, drifted: false, repaired: [] };
    }

    console.log(`[Reconciler] Found ${drifts.length} drifts for tenant ${tenantId}. Aligning actual state to desired state...`);
    const repaired = [];

    // Order matters. Let's process drifts in logical order: workspace/secrets/db -> compose -> certs/dns -> containers
    for (const drift of drifts) {
      try {
        console.log(`[Reconciler] Repairing drift: ${drift.type}`);
        
        if (drift.type === 'missing_workspace' || drift.type === 'missing_secrets' || drift.type === 'missing_db') {
          // Re-trigger provisioning through transaction runner
          await this.provisioner.provision(tenantId, desired);
          repaired.push(drift.type);
          break; // Break to re-evaluate after complete re-provisioning
        }

        if (drift.type === 'missing_compose') {
          const secrets = this.provisioner.secretGenerator.load(tenantId) || this.provisioner.secretGenerator.generate(tenantId);
          const dbName = `sj_tenant_${tenantId.replace(/-/g, '_')}`;
          const dbUser = `sj_user_${tenantId.replace(/-/g, '_')}`;
          this.provisioner.containerGenerator.generate(tenantId, {
            NODE_ENV: desired.environment || 'development',
            DATABASE_HOST: 'sj-postgres',
            DATABASE_PORT: 5432,
            DATABASE_NAME: dbName,
            DATABASE_USER: dbUser,
            DATABASE_PASSWORD: secrets.db_password,
            JWT_SECRET: secrets.jwt_secret
          });
          repaired.push(drift.type);
        }

        if (drift.type === 'missing_route') {
          const primaryDomain = desired.primary_domain || `${tenantId}.sj-cloud.test`;
          const customDomains = desired.custom_domains || [];
          this.provisioner.dnsGenerator.generate(tenantId, primaryDomain, customDomains);
          repaired.push(drift.type);
        }

        if (drift.type === 'missing_certs') {
          const primaryDomain = desired.primary_domain || `${tenantId}.sj-cloud.test`;
          this.provisioner.certificateGenerator.generate(tenantId, primaryDomain);
          repaired.push(drift.type);
        }

        if (drift.type === 'stopped_containers') {
          const tenantDir = path.join(this.tenantsDir, tenantId);
          execSync('docker compose up -d', { cwd: tenantDir, stdio: 'ignore' });
          repaired.push(drift.type);
        }

        if (drift.type === 'running_but_should_be_suspended') {
          const tenantDir = path.join(this.tenantsDir, tenantId);
          execSync('docker compose stop', { cwd: tenantDir, stdio: 'ignore' });
          repaired.push(drift.type);
        }

        if (drift.type === 'running_but_should_be_archived') {
          const tenantDir = path.join(this.tenantsDir, tenantId);
          execSync('docker compose down -v', { cwd: tenantDir, stdio: 'ignore' });
          repaired.push(drift.type);
        }
      } catch (err) {
        console.error(`[Reconciler] Failed to repair drift ${drift.type} for ${tenantId}:`, err.message);
        TenantEvents.emit('TENANT_RECONCILE_FAILED', tenantId, { drift: drift.type, error: err.message });
      }
    }

    if (repaired.length > 0) {
      TenantEvents.emit('TENANT_RECOVERED', tenantId, { repaired });
    }

    return { success: true, drifted: true, repaired };
  }
}

module.exports = { TenantReconciler };
