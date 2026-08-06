class PolicyContext {
  constructor(tenantId, appId, pipelineConfig = {}, details = {}) {
    this.tenantId = tenantId;
    this.appId = appId;
    this.pipelineConfig = pipelineConfig;
    this.details = details;
    this.timestamp = new Date();
  }
}

module.exports = {
  PolicyContext
};
