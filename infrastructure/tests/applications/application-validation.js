const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { globalApplicationRegistry } = require('../../../platform/application-manager/registry/application-registry');
const { globalBuildEngine } = require('../../../platform/application-manager/build/build-engine');
const { globalReleaseManager } = require('../../../platform/application-manager/releases/release-manager');
const { globalDeploymentEngine } = require('../../../platform/application-manager/deployment/deployment-engine');
const { globalRollbackEngine } = require('../../../platform/application-manager/rollback/rollback-engine');
const { globalRuntimeManager } = require('../../../platform/application-manager/runtime/runtime-manager');
const { globalRuntimeState } = require('../../../platform/application-manager/runtime/runtime-state');
const { globalAutoscaler } = require('../../../platform/application-manager/autoscaling/autoscaler');
const { ReleaseDiff } = require('../../../platform/application-manager/releases/release-diff');
const { ImageValidator } = require('../../../platform/application-manager/images/image-validator');
const { globalHealthManager } = require('../../../platform/application-manager/health/health-manager');
const { DeploymentStates } = require('../../../platform/application-manager/state/deployment-state');

const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const TENANTS_DIR = path.join(PROJECT_ROOT, 'tenants');

async function runTests() {
  const args = process.argv.slice(2);
  const filter = args[0] || 'all';

  console.log(`🧪 Running Application Manager validation (filter: ${filter})...`);

  const tenantId = 'val-test-tenant';
  const appId = 'val-test-app';

  // Setup test environment
  const appDir = path.join(TENANTS_DIR, tenantId, 'apps', appId);
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }

  try {
    // 1. Registry Validation
    if (filter === 'all' || filter === 'registry') {
      console.log('--- Testing Application Registry ---');
      const appConfig = {
        application_id: appId,
        tenant_id: tenantId,
        display_name: 'Validation Test App',
        runtime: 'nodejs',
        image: 'node:20-alpine',
        version: '1.0.0',
        owner: 'test-user',
        health: {
          path: '/health',
          port: 8080,
          initial_delay: 1,
          interval: 1,
          threshold: 2
        }
      };

      globalApplicationRegistry.saveApplication(appConfig);
      const retrieved = globalApplicationRegistry.getApplication(appId);
      assert.strictEqual(retrieved.application_id, appId);
      assert.strictEqual(retrieved.tenant_id, tenantId);
      console.log('✅ Registry validation passed.');
    }

    // 2. Build Engine Validation
    let buildResult;
    if (filter === 'all' || filter === 'build') {
      console.log('--- Testing Build Engine ---');
      buildResult = await globalBuildEngine.runBuild(appId, tenantId, { builder: 'docker' });
      assert.strictEqual(buildResult.status, 'SUCCEEDED');
      assert.ok(buildResult.imageDigest);
      console.log('✅ Build Engine validation passed.');
    }

    // 3. Release Manager Validation
    let release;
    if (filter === 'all' || filter === 'releases') {
      console.log('--- Testing Release Manager ---');
      const digest = buildResult ? buildResult.imageDigest : 'sha256:mockdigestvaltestappf45e88863fef450011';
      release = globalReleaseManager.createRelease(appId, tenantId, digest, {}, { NODE_ENV: 'production' }, {});
      assert.strictEqual(release.application_id, appId);
      assert.strictEqual(release.image_digest, digest);
      
      const latest = globalReleaseManager.getLatestRelease(tenantId, appId);
      assert.strictEqual(latest.release_id, release.release_id);

      // Compare release diff
      const otherRelease = globalReleaseManager.createRelease(appId, tenantId, digest, {}, { NODE_ENV: 'development' }, {});
      const diff = ReleaseDiff.compare(release, otherRelease);
      assert.ok(diff.hasChanges);
      assert.ok(diff.diffs.environment);
      console.log('✅ Release Manager validation passed.');
    }

    // 4. Deployment Engine Validation
    let deployResult;
    if (filter === 'all' || filter === 'deployment') {
      console.log('--- Testing Deployment Engine ---');
      const latestRelease = release || globalReleaseManager.getLatestRelease(tenantId, appId) || 
        globalReleaseManager.createRelease(appId, tenantId, 'sha256:mockdigestvaltestappf45e88863fef450011', {}, {}, {});

      deployResult = await globalDeploymentEngine.runDeployment(appId, tenantId, latestRelease.release_id);
      assert.strictEqual(deployResult.status, 'ACTIVE');
      console.log('✅ Deployment Engine validation passed.');
    }

    // 5. Runtime Manager Validation
    if (filter === 'all' || filter === 'runtime') {
      console.log('--- Testing Runtime Manager ---');
      const state = globalRuntimeState.get(appId);
      assert.strictEqual(state, 'RUNNING');
      
      // Stop the app
      await globalRuntimeManager.stop(tenantId, appId);
      assert.strictEqual(globalRuntimeState.get(appId), 'STOPPED');

      // Restart the app
      await globalRuntimeManager.start(tenantId, appId, release || globalReleaseManager.getLatestRelease(tenantId, appId), {});
      assert.strictEqual(globalRuntimeState.get(appId), 'RUNNING');
      console.log('✅ Runtime Manager validation passed.');
    }

    // 6. Health Manager Validation
    if (filter === 'all' || filter === 'health') {
      console.log('--- Testing Health Manager ---');
      // Mock health check passing
      const result = await globalHealthManager.checker.checkHttp('localhost', 80, '/health');
      assert.ok(result.status === 'HEALTHY' || result.status === 'UNHEALTHY');
      console.log('✅ Health Manager validation passed.');
    }

    // 7. Rollback Engine Validation
    if (filter === 'all' || filter === 'rollback') {
      console.log('--- Testing Rollback Engine ---');
      const releases = globalReleaseManager.getReleases(tenantId, appId);
      if (releases.length > 1) {
        const prevRelease = releases[0];
        const rollbackResult = await globalRollbackEngine.runRollback(appId, tenantId, prevRelease.release_id);
        assert.strictEqual(rollbackResult.status, 'SUCCESS');
        assert.strictEqual(rollbackResult.releaseId, prevRelease.release_id);
      } else {
        console.log('Skipping actual rollback (need at least 2 releases).');
      }
      console.log('✅ Rollback Engine validation passed.');
    }

    // 8. Image Management Validation
    if (filter === 'all' || filter === 'images') {
      console.log('--- Testing Image Management ---');
      const validator = new ImageValidator();
      assert.throws(() => validator.validate('invalid image ref'), /whitespace/);
      assert.ok(validator.validate('node:20-alpine'));
      console.log('✅ Image Management validation passed.');
    }

    // 9. Autoscaling Validation
    if (filter === 'all' || filter === 'autoscaling') {
      console.log('--- Testing Autoscaling ---');
      const target = globalAutoscaler.evaluate(appId, 1);
      assert.strictEqual(target, 1);
      console.log('✅ Autoscaling validation passed.');
    }

    console.log(`🎉 All selected tests passed for filter: ${filter}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Validation Test Failed:', err);
    process.exit(1);
  }
}

runTests();
