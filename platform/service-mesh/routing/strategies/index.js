const RoutingStrategy = require('./strategy-interface');
const RoundRobinStrategy = require('./round-robin');
const LeastConnectionsStrategy = require('./least-connections');
const WeightedStrategy = require('./weighted');
const RandomStrategy = require('./random');
const ConsistentHashStrategy = require('./consistent-hash');
const LatencyAwareStrategy = require('./latency-aware');

module.exports = {
  RoutingStrategy,
  RoundRobinStrategy,
  LeastConnectionsStrategy,
  WeightedStrategy,
  RandomStrategy,
  ConsistentHashStrategy,
  LatencyAwareStrategy
};
