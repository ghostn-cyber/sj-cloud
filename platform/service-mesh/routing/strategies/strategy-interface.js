class RoutingStrategy {
  constructor(name) {
    this.name = name;
  }

  /**
   * Select a target endpoint from available pool
   * @param {string} serviceId
   * @param {Array<Object>} pool Normalized pool (url and weight)
   * @param {Object} context Metadata context (optional)
   * @returns {string} The selected endpoint URL
   */
  select(serviceId, pool, context = {}) {
    throw new Error('Method select() must be implemented');
  }
}

module.exports = RoutingStrategy;
