class DeploymentInspector {
  inspect() {
    let deploymentsCount = 0;
    try {
      const { DeploymentFSM } = require('../application-manager/state/deployment-fsm');
      deploymentsCount = DeploymentFSM.getMetrics().deployment_total || 0;
    } catch (e) {}

    return {
      status: 'OK',
      activeDeployments: deploymentsCount,
      watchdogStatus: 'RUNNING',
      scaleEventsCount: 0
    };
  }
}

const globalDeploymentInspector = new DeploymentInspector();

module.exports = {
  DeploymentInspector,
  globalDeploymentInspector
};
