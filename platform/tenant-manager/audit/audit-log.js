class AuditLog {
  constructor(data = {}) {
    this.timestamp = data.timestamp || new Date().toISOString();
    this.tenantId = data.tenantId;
    this.actor = data.actor || 'system';
    this.action = data.action;
    this.oldState = data.oldState || null;
    this.newState = data.newState || null;
    this.correlationId = data.correlationId || `corr-${Math.random().toString(36).substring(2, 11)}`;
    this.traceId = data.traceId || `trace-${Math.random().toString(36).substring(2, 11)}`;
    this.reason = data.reason || '';
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      tenantId: this.tenantId,
      actor: this.actor,
      action: this.action,
      oldState: this.oldState,
      newState: this.newState,
      correlationId: this.correlationId,
      traceId: this.traceId,
      reason: this.reason
    };
  }
}

module.exports = { AuditLog };
