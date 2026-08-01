const { DeploymentStates } = require('./deployment-state');
const { isValidTransition } = require('./deployment-transition');
const { DeploymentError } = require('../../shared/errors');
const { ApplicationEvents } = require('../registry/application-events');

const fsmMetrics = {
  application_total: 0,
  application_active: 0,
  build_total: 0,
  deployment_total: 0,
  deployment_failures: 0,
  rollback_total: 0
};

class DeploymentFSM {
  constructor(appId, tenantId, currentState = DeploymentStates.CREATED) {
    this.appId = appId;
    this.tenantId = tenantId;
    this.state = currentState;
  }

  getState() {
    return this.state;
  }

  transitionTo(toState, details = {}) {
    if (!isValidTransition(this.state, toState)) {
      throw new DeploymentError(`Invalid transition from ${this.state} to ${toState} for application ${this.appId}`);
    }

    const oldState = this.state;
    this.state = toState;

    // Persist state change to Application Registry
    try {
      const { globalApplicationRegistry } = require('../registry/application-registry');
      const appConfig = globalApplicationRegistry.getApplication(this.appId);
      if (appConfig && appConfig.status !== toState) {
        appConfig.status = toState;
        globalApplicationRegistry.saveApplication(appConfig, false);
      }
    } catch (registryErr) {
      console.warn(`[DeploymentFSM] Could not persist state change to registry: ${registryErr.message}`);
    }

    // Track metrics
    if (toState === DeploymentStates.ACTIVE && oldState !== DeploymentStates.ACTIVE) {
      fsmMetrics.application_active++;
    }
    if (oldState === DeploymentStates.ACTIVE && toState !== DeploymentStates.ACTIVE) {
      fsmMetrics.application_active = Math.max(0, fsmMetrics.application_active - 1);
    }
    if (toState === DeploymentStates.BUILDING) {
      fsmMetrics.build_total++;
    }
    if (toState === DeploymentStates.DEPLOYING) {
      fsmMetrics.deployment_total++;
    }
    if (toState === DeploymentStates.FAILED) {
      fsmMetrics.deployment_failures++;
    }
    if (toState === DeploymentStates.ROLLBACK) {
      fsmMetrics.rollback_total++;
    }

    // Publish event
    ApplicationEvents.emit(toState, this.appId, {
      tenantId: this.tenantId,
      oldState,
      newState: toState,
      ...details
    });

    return this.state;
  }

  static getMetrics() {
    return fsmMetrics;
  }
}

module.exports = {
  DeploymentFSM,
  DeploymentStates
};
