const { DeploymentPlan } = require('./deployment-plan');
const { DeploymentExecutor } = require('./deployment-executor');
const { DeploymentValidator } = require('./deployment-validator');
const { DeploymentContext } = require('./deployment-context');
const { DeploymentEvents } = require('./deployment-events');
const { globalDeploymentHistory } = require('./deployment-history');
const { DeploymentFSM, DeploymentStates } = require('../state/deployment-fsm');
const { globalApplicationRegistry } = require('../registry/application-registry');
const { globalReleaseManager } = require('../releases/release-manager');
const { DeploymentError } = require('../../shared/errors');

class DeploymentEngine {
  constructor() {
    this.validator = new DeploymentValidator();
    this.executor = new DeploymentExecutor();
  }

  async runDeployment(appId, tenantId, releaseId) {
    const deploymentId = `dep-${Date.now()}`;
    const context = new DeploymentContext(appId, tenantId, deploymentId, releaseId);
    
    const appConfig = globalApplicationRegistry.getApplication(appId);
    if (!appConfig) {
      throw new DeploymentError(`Application not registered: ${appId}`);
    }

    const release = globalReleaseManager.getReleases(tenantId, appId).find(r => r.release_id === releaseId);
    if (!release) {
      throw new DeploymentError(`Release not found: ${releaseId}`);
    }

    const currentRegistryState = appConfig.status || DeploymentStates.CREATED;
    const fsm = new DeploymentFSM(appId, tenantId, currentRegistryState);

    try {
      this.validator.validate(appConfig, release);
      
      DeploymentEvents.emitStarted(appId, tenantId, deploymentId, releaseId);
      globalDeploymentHistory.record(appId, deploymentId, 'DEPLOYING', { releaseId });

      const strategy = release.deployment_strategy || 'Rolling';
      const steps = DeploymentPlan.generate(strategy, appId, tenantId, release);

      await this.executor.execute(context, steps, appConfig, fsm);

      fsm.transitionTo(DeploymentStates.ACTIVE, { deploymentId, releaseId });
      DeploymentEvents.emitCompleted(appId, tenantId, deploymentId, releaseId);
      globalDeploymentHistory.record(appId, deploymentId, 'ACTIVE', { releaseId });

      appConfig.status = DeploymentStates.ACTIVE;
      appConfig.image = release.image_digest;
      appConfig.version = release.runtime_version;
      globalApplicationRegistry.saveApplication(appConfig, false);

      return {
        deploymentId,
        status: 'ACTIVE',
        releaseId,
        logs: context.logs
      };
    } catch (err) {
      context.log(`Deployment execution failed: ${err.message}`);
      
      try {
        fsm.transitionTo(DeploymentStates.FAILED, { deploymentId, releaseId, error: err.message });
      } catch {}
      
      DeploymentEvents.emitFailed(appId, tenantId, deploymentId, releaseId, err);
      globalDeploymentHistory.record(appId, deploymentId, 'FAILED', { releaseId, error: err.message });

      appConfig.status = DeploymentStates.FAILED;
      globalApplicationRegistry.saveApplication(appConfig, false);

      throw err;
    }
  }
}

const globalDeploymentEngine = new DeploymentEngine();

module.exports = {
  DeploymentEngine,
  globalDeploymentEngine
};
