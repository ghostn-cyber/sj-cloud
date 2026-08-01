const crypto = require('crypto');

class Release {
  constructor(data) {
    this.release_id = data.release_id || `rel-${Date.now()}`;
    this.application_id = data.application_id;
    this.tenant_id = data.tenant_id;
    this.image_digest = data.image_digest;
    this.environment_snapshot = Object.freeze({ ...(data.environment_snapshot || {}) });
    this.secrets_snapshot = Object.freeze({ ...(data.secrets_snapshot || {}) });
    this.deployment_strategy = data.deployment_strategy || 'Rolling';
    this.health_policy = Object.freeze({ ...(data.health_policy || {}) });
    this.runtime_version = data.runtime_version || '1.0.0';
    this.timestamp = data.timestamp || Date.now();
    
    // Generate an immutable checksum
    const raw = JSON.stringify({
      app: this.application_id,
      digest: this.image_digest,
      env: this.environment_snapshot,
      sec: this.secrets_snapshot,
      strat: this.deployment_strategy,
      health: this.health_policy,
      runtime: this.runtime_version
    });
    this.checksum = crypto.createHash('sha256').update(raw).digest('hex');
    Object.freeze(this);
  }
}

module.exports = { Release };
