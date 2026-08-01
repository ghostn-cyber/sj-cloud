const { ApplicationEvents } = require('../registry/application-events');

class DeploymentEvents {
  static emitStarted(appId, tenantId, deploymentId, releaseId) {
    ApplicationEvents.emit('DEPLOYMENT_STARTED', appId, { tenantId, deploymentId, releaseId });
  }

  static emitCompleted(appId, tenantId, deploymentId, releaseId) {
    ApplicationEvents.emit('DEPLOYMENT_COMPLETED', appId, { tenantId, deploymentId, releaseId });
  }

  static emitFailed(appId, tenantId, deploymentId, releaseId, error) {
    ApplicationEvents.emit('DEPLOYMENT_FAILED', appId, { tenantId, deploymentId, releaseId, error: error.message });
  }
}

module.exports = { DeploymentEvents };
