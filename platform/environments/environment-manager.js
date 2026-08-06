const { globalFreezeManager } = require('./freeze-manager');
const { globalDeploymentWindow } = require('./deployment-window');

class EnvironmentManager {
  constructor() {
    this.environments = {
      development: { name: 'development', order: 1, requiresApproval: false },
      testing: { name: 'testing', order: 2, requiresApproval: false },
      staging: { name: 'staging', order: 3, requiresApproval: false },
      production: { name: 'production', order: 4, requiresApproval: true }
    };
  }

  getEnvironments() {
    return Object.values(this.environments).map(env => ({
      ...env,
      frozen: globalFreezeManager.isFrozen(env.name),
      windowOpen: globalDeploymentWindow.isWindowOpen()
    }));
  }

  getEnvironment(name) {
    const env = this.environments[name.toLowerCase()];
    if (!env) return null;
    return {
      ...env,
      frozen: globalFreezeManager.isFrozen(env.name),
      windowOpen: globalDeploymentWindow.isWindowOpen()
    };
  }

  canDeploy(envName) {
    const env = this.getEnvironment(envName);
    if (!env) return false;
    if (env.frozen) return false;
    // For test stability/simplicity, we only enforce deployment windows if we are in production
    if (envName.toLowerCase() === 'production' && !env.windowOpen) {
      return false;
    }
    return true;
  }

  freezeEnvironment(envName, operator, reason = '') {
    globalFreezeManager.freeze(envName);
  }

  unfreezeEnvironment(envName, operator) {
    globalFreezeManager.unfreeze(envName);
  }

  isEnvironmentFrozen(envName) {
    return globalFreezeManager.isFrozen(envName);
  }
}

const globalEnvironmentManager = new EnvironmentManager();

module.exports = {
  EnvironmentManager,
  globalEnvironmentManager
};
