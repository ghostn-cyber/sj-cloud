const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { globalTenantRegistry } = require('../../../platform/tenant-manager/registry/tenant-registry');
const { Provisioner } = require('../../../platform/tenant-manager/provisioning/provisioner');
const { LifecycleFSM, TenantStates } = require('../../../platform/tenant-manager/lifecycle/lifecycle-fsm');
const { TenantContext } = require('../../../platform/tenant-manager/runtime/runtime-context');

const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const TENANTS_DIR = path.join(PROJECT_ROOT, 'tenants');
const provisioner = new Provisioner(TENANTS_DIR);

async function runTests() {
  const args = process.argv.slice(2);
  const filter = args[0] || 'all';

  console.log(`🧪 Running Tenant Lifecycle & Provisioning validation (filter: ${filter})...`);

  const testTenantId = 'val-test-tenant';
  const testDir = path.join(TENANTS_DIR, testTenantId);

  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    const traefikConfigFile = path.join(PROJECT_ROOT, 'infrastructure/traefik/dynamic', `tenant-${testTenantId}.yml`);
    if (fs.existsSync(traefikConfigFile)) fs.unlinkSync(traefikConfigFile);
    globalTenantRegistry.deleteTenant(testTenantId);
  } catch {}

  try {
    const needsProvisioning = ['all', 'provisioning', 'routing', 'certificates', 'rollback', 'database'].includes(filter);
    if (needsProvisioning) {
      if (filter === 'all' || filter === 'provisioning') {
        console.log('... Running provisioning & creation tests ...');
      } else {
        console.log('... Provisioning tenant for tests ...');
      }
      const config = await provisioner.provision(testTenantId, {
        display_name: 'Validation Test Tenant',
        slug: testTenantId,
        plan: 'premium',
        primary_domain: `${testTenantId}.sj-cloud.test`,
        custom_domains: ['val.custom.com']
      });

      if (filter === 'all' || filter === 'provisioning') {
        assert.strictEqual(config.tenant_id, testTenantId);
        assert.strictEqual(config.status, 'ACTIVE');
        assert.strictEqual(config.plan, 'premium');

        assert.ok(fs.existsSync(testDir), 'Workspace should exist');
        assert.ok(fs.existsSync(path.join(testDir, 'data')), 'Data volume should exist');
        assert.ok(fs.existsSync(path.join(testDir, 'logs')), 'Logs volume should exist');
        assert.ok(fs.existsSync(path.join(testDir, 'secrets.json')), 'Secrets file should exist');
        assert.ok(fs.existsSync(path.join(testDir, 'docker-compose.yml')), 'docker-compose file should exist');

        console.log('✅ Provisioning & creation tests passed.');
      }
    }

    if (filter === 'all' || filter === 'routing') {
      console.log('... Running routing & DNS tests ...');
      const traefikConfigFile = path.join(PROJECT_ROOT, 'infrastructure/traefik/dynamic', `tenant-${testTenantId}.yml`);
      assert.ok(fs.existsSync(traefikConfigFile), 'Traefik dynamic configuration file should exist');
      
      const content = fs.readFileSync(traefikConfigFile, 'utf8');
      assert.ok(content.includes(testTenantId), 'Traefik config should reference tenant ID');
      assert.ok(content.includes('websecure'), 'Traefik config should include websecure entrypoint');
      console.log('✅ Routing & DNS tests passed.');
    }

    if (filter === 'all' || filter === 'certificates') {
      console.log('... Running SSL certificates tests ...');
      const certsDir = path.join(PROJECT_ROOT, 'infrastructure/traefik/certificates/development');
      const keyPath = path.join(certsDir, `tenant-${testTenantId}.key`);
      const crtPath = path.join(certsDir, `tenant-${testTenantId}.crt`);

      assert.ok(fs.existsSync(keyPath), 'TLS Key file should exist');
      assert.ok(fs.existsSync(crtPath), 'TLS Certificate file should exist');
      console.log('✅ SSL certificates tests passed.');
    }

    if (filter === 'all' || filter === 'lifecycle') {
      console.log('... Running FSM lifecycle transitions tests ...');
      const fsm = new LifecycleFSM(testTenantId, TenantStates.ACTIVE);
      assert.strictEqual(fsm.getState(), TenantStates.ACTIVE);

      fsm.transitionTo(TenantStates.SUSPENDED);
      assert.strictEqual(fsm.getState(), TenantStates.SUSPENDED);

      fsm.transitionTo(TenantStates.ACTIVE);
      assert.strictEqual(fsm.getState(), TenantStates.ACTIVE);

      try {
        fsm.transitionTo(TenantStates.DELETED);
        assert.fail('Should fail on invalid transition');
      } catch (err) {
        assert.strictEqual(err.name, 'LifecycleError');
      }

      console.log('✅ Lifecycle transitions tests passed.');
    }

    if (filter === 'all' || filter === 'rollback') {
      console.log('... Running configuration versioning & rollback tests ...');
      const currentConfig = globalTenantRegistry.getTenant(testTenantId);
      assert.ok(currentConfig, 'Config should exist in registry');

      const buildNum = globalTenantRegistry.version.createVersionSnapshot(testTenantId, currentConfig);
      currentConfig.plan = 'basic-mutated';
      globalTenantRegistry.saveTenant(currentConfig, false);

      assert.strictEqual(globalTenantRegistry.getTenant(testTenantId).plan, 'basic-mutated');

      const restored = globalTenantRegistry.version.rollbackTo(testTenantId, buildNum);
      assert.strictEqual(restored.plan, 'premium');
      
      console.log('✅ Rollback & versioning tests passed.');
    }

    if (filter === 'all' || filter === 'database') {
      console.log('... Running database provisioning tests ...');
      const secrets = provisioner.secretGenerator.load(testTenantId);
      assert.ok(secrets.db_password, 'DB password should be generated');
      console.log('✅ Database provisioning tests passed.');
    }

    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      const traefikConfigFile = path.join(PROJECT_ROOT, 'infrastructure/traefik/dynamic', `tenant-${testTenantId}.yml`);
      if (fs.existsSync(traefikConfigFile)) fs.unlinkSync(traefikConfigFile);
      globalTenantRegistry.deleteTenant(testTenantId);
    } catch {}

    console.log('🎉 All selected tenant lifecycle engine tests passed successfully!');
  } catch (err) {
    console.error('❌ Test validation failed:', err);
    process.exit(1);
  }
}

runTests();
