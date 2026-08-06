class MetricsRegistry {
  constructor() {
    this.definitions = new Map();
  }

  register(name, type, help, allowedLabels = []) {
    this.definitions.set(name, {
      name,
      type,
      help,
      allowedLabels
    });
  }

  getDefinition(name) {
    return this.definitions.get(name);
  }

  getAllDefinitions() {
    return Array.from(this.definitions.values());
  }
}

const globalMetricsRegistry = new MetricsRegistry();

// Register standard platform metrics
globalMetricsRegistry.register('sj_application_runs_total', 'counter', 'Total number of application executions', ['tenant_id', 'app_id']);
globalMetricsRegistry.register('sj_application_failures_total', 'counter', 'Total application run failures', ['tenant_id', 'app_id']);
globalMetricsRegistry.register('sj_pipeline_runs_total', 'counter', 'Total pipeline executions', ['tenant_id']);
globalMetricsRegistry.register('sj_pipeline_runs_success', 'counter', 'Total successful pipeline runs', ['tenant_id']);
globalMetricsRegistry.register('sj_pipeline_runs_failed', 'counter', 'Total failed pipeline runs', ['tenant_id']);
globalMetricsRegistry.register('sj_pipeline_runs_cancelled', 'counter', 'Total cancelled pipeline runs', ['tenant_id']);
globalMetricsRegistry.register('sj_mesh_requests_total', 'counter', 'Total requests flowing through service mesh', ['tenant_id', 'service']);
globalMetricsRegistry.register('sj_circuit_breaker_trips_total', 'counter', 'Total circuit breaker trips', ['tenant_id', 'service']);
globalMetricsRegistry.register('sj_capacity_cpu_utilization', 'gauge', 'CPU utilization percentage', ['node']);
globalMetricsRegistry.register('sj_capacity_memory_utilization', 'gauge', 'Memory utilization percentage', ['node']);
globalMetricsRegistry.register('sj_capacity_disk_utilization', 'gauge', 'Disk utilization percentage', ['node']);
globalMetricsRegistry.register('sj_backups_verified_total', 'counter', 'Total successful backup verifications', ['tenant_id']);
globalMetricsRegistry.register('sj_backups_failures_total', 'counter', 'Total failed backup verifications', ['tenant_id']);
globalMetricsRegistry.register('sj_alerts_triggered_total', 'counter', 'Total alerts triggered', ['severity', 'rule']);
globalMetricsRegistry.register('sj_incidents_active', 'gauge', 'Total active unresolved incidents', ['severity']);
globalMetricsRegistry.register('sj_platform_health_score', 'gauge', 'Overall platform health score (0-100)');

module.exports = {
  MetricsRegistry,
  globalMetricsRegistry
};
