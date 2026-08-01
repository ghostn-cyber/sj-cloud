class AuditLogger {
  constructor(writer = console.log) {
    this.writer = writer;
  }

  logAccess(context, resource, action, allowed, reason = '') {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType: 'SECURITY_AUDIT',
      tenantId: context.tenant?.tenantId || 'system',
      sourceService: context.service?.sourceService || 'unknown',
      destinationService: context.service?.destinationService || 'unknown',
      requestId: context.service?.requestId || 'unknown',
      resource,
      action,
      allowed,
      reason
    };
    this.writer(JSON.stringify(auditEntry));
  }
}

const globalAuditLogger = new AuditLogger();

module.exports = {
  AuditLogger,
  globalAuditLogger
};
