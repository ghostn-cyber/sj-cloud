const { globalEventBus } = require('../../service-mesh/events');

class ApplicationEvents {
  static emit(type, appId, details = {}) {
    globalEventBus.publish(type, {
      applicationId: appId,
      tenantId: details.tenantId || details.tenant_id,
      ...details,
      timestamp: Date.now()
    });
  }
}

module.exports = {
  ApplicationEvents
};
