class ScalingPolicy {
  evaluate(metrics, currentReplicas) {
    const { cpu, memory } = metrics;
    let targetReplicas = currentReplicas;
    let reason = 'Metrics stable';

    if (cpu > 80) {
      targetReplicas = Math.min(5, currentReplicas + 1);
      reason = `High CPU utilization: ${cpu}%`;
    } else if (cpu < 20 && currentReplicas > 1) {
      targetReplicas = Math.max(1, currentReplicas - 1);
      reason = `Low CPU utilization: ${cpu}%`;
    }

    return { replicas: targetReplicas, reason };
  }
}

module.exports = { ScalingPolicy };
