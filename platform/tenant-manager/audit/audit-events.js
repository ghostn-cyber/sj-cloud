const { globalEventBus } = require('../../service-mesh/events');
const { AuditWriter } = require('./audit-writer');

class AuditEvents {
  constructor(tenantsDir) {
    this.writer = new AuditWriter(tenantsDir);
  }

  initialize() {
    const events = [
      'TENANT_CREATING',
      'TENANT_PROVISIONING',
      'TENANT_STARTING',
      'TENANT_ACTIVE',
      'TENANT_SUSPENDED',
      'TENANT_UPDATING',
      'TENANT_MIGRATING',
      'TENANT_RESTORING',
      'TENANT_ARCHIVED',
      'TENANT_FAILED',
      'TENANT_DELETING',
      'TENANT_DELETED',
      'TENANT_RECONCILE_FAILED',
      'TENANT_RECOVERED',
      'TENANT_SECRET_ROTATED',
      'TENANT_CERTIFICATE_RENEWED'
    ];

    for (const event of events) {
      globalEventBus.subscribe(event, (payload) => {
        const { tenantId, oldState, newState, reason, details, actor } = payload;
        
        let action = event.replace('TENANT_', '').replace('_', ' ');
        // Format action name nicely (e.g. "CREATING" -> "Tenant Creating")
        action = 'Tenant ' + action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();

        this.writer.write(tenantId, {
          actor: actor || payload.actor || 'system',
          action,
          oldState: oldState || payload.oldState || null,
          newState: newState || payload.newState || null,
          reason: reason || payload.reason || '',
          correlationId: payload.correlationId,
          traceId: payload.traceId
        });
      });
    }
  }
}

module.exports = { AuditEvents };
