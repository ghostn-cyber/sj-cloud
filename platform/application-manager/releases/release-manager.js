const { Release } = require('./release');
const { ReleaseHistory } = require('./release-history');
const { ReleaseValidator } = require('./release-validator');
const { ReleaseEvents } = require('./release-events');
const { ReleaseError } = require('../../shared/errors');

class ReleaseManager {
  constructor(tenantsDir) {
    this.history = new ReleaseHistory(tenantsDir);
    this.validator = new ReleaseValidator();
  }

  createRelease(appId, tenantId, imageDigest, configSnapshot = {}, envSnapshot = {}, secretsSnapshot = {}) {
    console.log(`[ReleaseManager] Generating new release for app: ${appId} (Tenant: ${tenantId})...`);
    
    try {
      const release = new Release({
        application_id: appId,
        tenant_id: tenantId,
        image_digest: imageDigest,
        environment_snapshot: envSnapshot,
        secrets_snapshot: secretsSnapshot,
        deployment_strategy: configSnapshot.strategy || 'Rolling',
        health_policy: configSnapshot.health || {}
      });

      this.validator.validate(release);
      this.history.record(tenantId, appId, release);
      ReleaseEvents.emitCreated(appId, tenantId, release.release_id);

      return release;
    } catch (err) {
      console.error(`[ReleaseManager] Failed to create release: ${err.message}`);
      throw new ReleaseError(`Failed to create release: ${err.message}`);
    }
  }

  getReleases(tenantId, appId) {
    return this.history.getReleases(tenantId, appId);
  }

  getLatestRelease(tenantId, appId) {
    const list = this.getReleases(tenantId, appId);
    return list.length > 0 ? list[list.length - 1] : null;
  }
}

const globalReleaseManager = new ReleaseManager();

module.exports = {
  ReleaseManager,
  globalReleaseManager
};
