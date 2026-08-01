const RoutingStrategy = require('./strategy-interface');

class ConsistentHashStrategy extends RoutingStrategy {
  constructor() {
    super('consistent_hash');
  }

  select(serviceId, pool, context = {}) {
    throw new Error('ConsistentHashStrategy: Method not implemented');
  }
}

module.exports = ConsistentHashStrategy;
