const RoutingStrategy = require('./strategy-interface');

class LeastConnectionsStrategy extends RoutingStrategy {
  constructor() {
    super('least_connections');
  }

  select(serviceId, pool, context = {}) {
    throw new Error('LeastConnectionsStrategy: Method not implemented');
  }
}

module.exports = LeastConnectionsStrategy;
