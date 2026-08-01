const { LifecycleError } = require('../../shared/errors');
const { TenantEvents } = require('../registry/tenant-events');

const TenantStates = {
  CREATING: 'CREATING',
  PROVISIONING: 'PROVISIONING',
  STARTING: 'STARTING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  UPDATING: 'UPDATING',
  MIGRATING: 'MIGRATING',
  RESTORING: 'RESTORING',
  ARCHIVED: 'ARCHIVED',
  FAILED: 'FAILED',
  DELETING: 'DELETING',
  DELETED: 'DELETED'
};

const ValidTransitions = {
  'CREATING': ['PROVISIONING', 'FAILED', 'DELETING'],
  'PROVISIONING': ['STARTING', 'FAILED', 'DELETING'],
  'STARTING': ['ACTIVE', 'FAILED', 'DELETING'],
  'ACTIVE': ['SUSPENDED', 'UPDATING', 'MIGRATING', 'ARCHIVED', 'DELETING', 'FAILED'],
  'SUSPENDED': ['ACTIVE', 'DELETING', 'FAILED'],
  'UPDATING': ['ACTIVE', 'FAILED'],
  'MIGRATING': ['ACTIVE', 'FAILED'],
  'RESTORING': ['ACTIVE', 'FAILED'],
  'ARCHIVED': ['RESTORING', 'DELETING', 'FAILED'],
  'FAILED': ['PROVISIONING', 'STARTING', 'RESTORING', 'DELETING'],
  'DELETING': ['DELETED', 'FAILED'],
  'DELETED': []
};

const tenantMetrics = {
  tenant_total: 0,
  tenant_active: 0,
  tenant_failed: 0,
  tenant_rollbacks: 0,
  tenant_provision_time: [],
  tenant_states: {},
  tenant_events: 0
};

class LifecycleFSM {
  constructor(tenantId, initialState = TenantStates.CREATING) {
    this.tenantId = tenantId;
    this.state = initialState;
  }

  getState() {
    return this.state;
  }

  transitionTo(newState) {
    if (this.state === newState) return;
    const allowed = ValidTransitions[this.state] || [];
    if (!allowed.includes(newState)) {
      throw new LifecycleError(`Invalid state transition for tenant ${this.tenantId}: ${this.state} -> ${newState}`);
    }

    const oldState = this.state;
    this.state = newState;
    tenantMetrics.tenant_events++;

    this.updateMetrics(oldState, newState);

    TenantEvents.emit(`TENANT_${newState}`, this.tenantId, {
      oldState,
      newState
    });
  }

  updateMetrics(oldState, newState) {
    tenantMetrics.tenant_states[newState] = (tenantMetrics.tenant_states[newState] || 0) + 1;
    if (tenantMetrics.tenant_states[oldState]) {
      tenantMetrics.tenant_states[oldState] = Math.max(0, tenantMetrics.tenant_states[oldState] - 1);
    }

    if (newState === TenantStates.ACTIVE) {
      tenantMetrics.tenant_active++;
    }
    if (oldState === TenantStates.ACTIVE) {
      tenantMetrics.tenant_active = Math.max(0, tenantMetrics.tenant_active - 1);
    }
    if (newState === TenantStates.FAILED) {
      tenantMetrics.tenant_failed++;
    }
    if (oldState === TenantStates.FAILED) {
      tenantMetrics.tenant_failed = Math.max(0, tenantMetrics.tenant_failed - 1);
    }
  }

  static getMetrics() {
    return tenantMetrics;
  }

  static recordProvisionTime(ms) {
    tenantMetrics.tenant_provision_time.push(ms);
  }

  static recordRollback() {
    tenantMetrics.tenant_rollbacks++;
  }
}

module.exports = {
  LifecycleFSM,
  TenantStates
};
