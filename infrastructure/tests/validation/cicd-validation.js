const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { globalRepositoryRegistry } = require('../../../platform/repository-manager/registry/repository-registry');
const { globalRepositorySync } = require('../../../platform/repository-manager/sync/repository-sync');
const { globalPipelineEngine } = require('../../../platform/pipeline-engine/pipeline-engine');
const { globalLogManager } = require('../../../platform/pipeline-engine/logs/log-manager');
const { globalSecretManager } = require('../../../platform/secrets/secret-manager');
const { globalEnvironmentManager } = require('../../../platform/environments/environment-manager');
const { globalPromotionEngine } = require('../../../platform/environments/promotion-engine');
const { globalWebhookReceiver } = require('../../../platform/webhooks/webhook-receiver');
const { globalApplicationRegistry } = require('../../../platform/application-manager/registry/application-registry');
const { globalArtifactManager } = require('../../../platform/artifact-registry/artifact-manager');
const { globalReleaseManager } = require('../../../platform/application-manager/releases/release-manager');

const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const TENANTS_DIR = path.join(PROJECT_ROOT, 'tenants');

async function runTests() {
  console.log('🧪 Running Developer Platform & CI/CD Engine validation...');

  const tenantId = 'cicd-test-tenant';
  const appId = 'cicd-test-app';
  const repoId = 'cicd-test-repo';

  // Create workspace directories
  fs.mkdirSync(path.join(TENANTS_DIR, tenantId, 'apps', appId), { recursive: true });
  fs.mkdirSync(path.join(TENANTS_DIR, tenantId, 'repositories'), { recursive: true });

  // Pre-register application to allow pipeline resolution
  globalApplicationRegistry.saveApplication({
    application_id: appId,
    tenant_id: tenantId,
    display_name: 'CI/CD Test Application',
    runtime: 'nodejs',
    image: 'node:20-alpine',
    version: '1.0.0',
    owner: 'test-owner'
  });

  try {
    // 1. Secrets Manager Validation (AES-256-GCM encryption/decryption)
    console.log('--- Testing Secrets Manager ---');
    const secretName = 'DATABASE_URL';
    const secretVal = 'postgres://admin:supersecret@db.sjcloud:5432/main';
    globalSecretManager.saveSecret(tenantId, secretName, secretVal);
    
    // Decrypted retrieve
    const retrievedVal = globalSecretManager.getSecret(tenantId, secretName);
    assert.strictEqual(retrievedVal, secretVal);

    // List secrets should return metadata only (masking values)
    const keys = globalSecretManager.getSecretKeys(tenantId);
    assert.ok(keys.includes(secretName));
    
    // Check audit trails
    const history = globalSecretManager.history.getHistory(tenantId);
    assert.ok(history.length > 0);
    assert.strictEqual(history[0].details.value, undefined); // Masked
    console.log('✅ Secrets Manager validation passed.');

    // 2. Repository Manager Validation
    console.log('--- Testing Repository Manager ---');
    const repoConfig = {
      repository_id: repoId,
      tenant_id: tenantId,
      name: 'example-repo',
      provider: 'github',
      url: 'https://github.com/startupjigawa/example-node-app.git',
      branch: 'main',
      auth_type: 'none',
      webhook_secret: 'webhook-super-secret-token-key'
    };
    globalRepositoryRegistry.saveRepository(repoConfig);
    const retrievedRepo = globalRepositoryRegistry.getRepository(repoId);
    assert.strictEqual(retrievedRepo.repository_id, repoId);
    assert.strictEqual(retrievedRepo.url, repoConfig.url);

    // Force sync
    const syncRes = await globalRepositorySync.sync(tenantId, repoId);
    assert.strictEqual(syncRes.success, true);
    console.log('✅ Repository Manager validation passed.');

    // 3. Webhook Receiver & signature security validation
    console.log('--- Testing Webhook Receiver ---');
    const webhookPayload = {
      ref: 'refs/heads/main',
      repository: {
        clone_url: 'https://github.com/startupjigawa/example-node-app.git',
        git_url: 'git://github.com/startupjigawa/example-node-app.git'
      },
      repository_id: repoId,
      pusher: { name: 'test-developer' }
    };
    const payloadStr = JSON.stringify(webhookPayload);
    const signature = 'sha256=' + crypto
      .createHmac('sha256', repoConfig.webhook_secret)
      .update(payloadStr)
      .digest('hex');

    const headers = {
      'x-github-delivery': 'delivery-uuid-123456',
      'x-github-event': 'push',
      'x-hub-signature-256': signature,
      'x-request-timestamp': new Date().toISOString()
    };

    const webhookResult = await globalWebhookReceiver.handleWebhook(headers, payloadStr);
    assert.strictEqual(webhookResult.tenantId, tenantId);
    assert.ok(webhookResult.triggered.length > 0);
    console.log('✅ Webhook Receiver validation passed.');

    // 4. Pipeline Engine Validation
    console.log('--- Testing Pipeline Engine ---');
    // The webhook triggered a pipeline run. Let's retrieve it.
    const runs = globalPipelineEngine.getAllPipelineRuns(tenantId);
    assert.ok(runs.length > 0);
    
    const runId = runs[0].pipelineId;
    const run = globalPipelineEngine.getPipelineRun(tenantId, runId);
    assert.strictEqual(run.status, 'SUCCESS'); // FSM state transitioned to success
    
    // Check stages completion
    const checkoutStage = run.stages.Checkout || run.stages['Checkout'];
    assert.ok(checkoutStage);
    assert.strictEqual(checkoutStage.status, 'SUCCESS');

    // Check custom artifacts publish
    const publishedArtifacts = globalArtifactManager.getAllArtifacts().filter(a => a.tenant_id === tenantId);
    assert.ok(publishedArtifacts.length > 0);
    console.log('✅ Pipeline Engine validation passed.');

    // 5. Environment & Promotion Engine Validation
    console.log('--- Testing Environment & Promotion Engine ---');
    globalEnvironmentManager.environments.staging.requiresApproval = true;
    const latestRelease = globalReleaseManager.getLatestRelease(tenantId, appId);
    const releaseId = latestRelease ? latestRelease.release_id : 'rel-test-version-100';
    const promo = await globalPromotionEngine.startPromotion(tenantId, appId, releaseId, 'development', 'staging');
    assert.strictEqual(promo.status, 'PENDING_APPROVAL'); // Requires manual approval for staging

    const approvedPromo = await globalPromotionEngine.approvePromotion(promo.promotionId, 'ops-admin');
    assert.strictEqual(approvedPromo.status, 'SUCCESS');

    // Freeze environment test
    globalEnvironmentManager.freezeEnvironment('production', 'ops-admin', 'Major DB migration freeze window');
    assert.ok(globalEnvironmentManager.isEnvironmentFrozen('production'));

    // Attempt promotion to frozen environment should throw / fail
    await assert.rejects(
      async () => {
        await globalPromotionEngine.startPromotion(tenantId, appId, releaseId, 'staging', 'production');
      },
      /Environment production is currently frozen/
    );

    // Unfreeze and try again
    globalEnvironmentManager.unfreezeEnvironment('production', 'ops-admin');
    assert.strictEqual(globalEnvironmentManager.isEnvironmentFrozen('production'), false);
    console.log('✅ Environment & Promotion validation passed.');

    console.log('\n🎉 ALL CI/CD ENGINE & DEVELOPER PLATFORM TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('\n❌ CI/CD Validation Failed:', err);
    process.exit(1);
  }
}

runTests();
