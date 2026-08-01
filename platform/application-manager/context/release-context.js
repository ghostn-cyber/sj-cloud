class ReleaseContext {
  constructor(releaseId, imageDigest, configSnapshot, envSnapshot) {
    this.release_id = releaseId;
    this.image_digest = imageDigest;
    this.config_snapshot = Object.freeze({ ...(configSnapshot || {}) });
    this.env_snapshot = Object.freeze({ ...(envSnapshot || {}) });
    this.timestamp = Date.now();
    Object.freeze(this);
  }
}

module.exports = { ReleaseContext };
