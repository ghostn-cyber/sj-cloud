const { globalEventBus } = require('../../service-mesh/events');

class TenantEvents {
  static emit(type, tenantId, details = {}) {
    globalEventBus.publish(type, {
      tenantId,
      ...details,
      timestamp: Date.now()
    });
  }
}

module.exports = {
  TenantEvents
};
