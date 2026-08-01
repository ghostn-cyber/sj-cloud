class DeploymentHistory {
  constructor() {
    this.history = [];
  }

  record(appId, deploymentId, status, details = {}) {
    this.history.push({
      timestamp: new Date().toISOString(),
      appId,
      deploymentId,
      status,
      ...details
    });
  }

  getHistory(appId) {
    return this.history.filter(h => h.appId === appId);
  }
}

const globalDeploymentHistory = new DeploymentHistory();

module.exports = {
  DeploymentHistory,
  globalDeploymentHistory
};
