const RoutingStrategy = require('./strategy-interface');

class WeightedStrategy extends RoutingStrategy {
  constructor() {
    super('weighted');
  }

  select(serviceId, pool, context = {}) {
    throw new Error('WeightedStrategy: Method not implemented');
  }
}

module.exports = WeightedStrategy;
