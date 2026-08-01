const { metricsProvider } = require('./metrics-provider');
const { ScalingPolicy } = require('./scaling-policy');
const { ScalingEvents } = require('./scaling-events');

class Autoscaler {
  constructor() {
    this.policy = new ScalingPolicy();
  }

  evaluate(appId, currentReplicas) {
    console.log(`[Autoscaler] Evaluating scaling metrics for application: ${appId}...`);
    const metrics = metricsProvider.getMetrics(appId);
    const recommendation = this.policy.evaluate(metrics, currentReplicas);

    if (recommendation.replicas !== currentReplicas) {
      console.log(`[Autoscaler] Scaling recommendation for ${appId}: ${currentReplicas} -> ${recommendation.replicas}`);
      ScalingEvents.emitScalingEvent(appId, currentReplicas, recommendation.replicas, recommendation.reason);
      return recommendation.replicas;
    }

    return currentReplicas;
  }
}

const globalAutoscaler = new Autoscaler();

module.exports = {
  Autoscaler,
  globalAutoscaler
};
