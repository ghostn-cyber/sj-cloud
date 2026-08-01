const { globalTenantRegistry } = require('../registry/tenant-registry');
const { LifecycleFSM, TenantStates } = require('../lifecycle/lifecycle-fsm');

class LifecyclePolicy {
  evaluate(action, tenantId, params = {}) {
    const tenant = globalTenantRegistry.getTenant(tenantId);
    
    // Actions correspond to FSM transitions
    if (action === 'start') {
      if (tenant && tenant.status === 'ACTIVE') {
        return { allowed: false, reason: 'Tenant is already ACTIVE' };
      }
    }

    if (action === 'stop') {
      if (tenant && tenant.status === 'SUSPENDED') {
        return { allowed: false, reason: 'Tenant is already SUSPENDED' };
      }
    }

    if (action === 'archive') {
      if (tenant && tenant.status === 'ARCHIVED') {
        return { allowed: false, reason: 'Tenant is already ARCHIVED' };
      }
    }

    if (action === 'restore') {
      if (tenant && tenant.status !== 'ARCHIVED' && tenant.status !== 'SUSPENDED') {
        return { allowed: false, reason: 'Only SUSPENDED or ARCHIVED tenants can be restored' };
      }
    }

    return { allowed: true };
  }
}

module.exports = { LifecyclePolicy };
