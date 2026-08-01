class DeploymentContext {
  constructor(appId, tenantId, deploymentId, releaseId) {
    this.appId = appId;
    this.tenantId = tenantId;
    this.deploymentId = deploymentId || `dep-${Date.now()}`;
    this.releaseId = releaseId;
    this.logs = [];
    this.status = 'PENDING';
  }

  log(message) {
    const formatted = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(formatted);
    console.log(`[Deployment ${this.deploymentId}] ${message}`);
  }
}

module.exports = { DeploymentContext };
