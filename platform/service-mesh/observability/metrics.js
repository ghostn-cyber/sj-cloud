class TelemetryRegistry {
  constructor() {
    this.requests = {}; // Key format: tenant:source:dest:code -> count
    this.durationSum = {}; // Key format: tenant:source:dest -> ms
    this.durationCount = {}; // Key format: tenant:source:dest -> count
    this.retries = {}; // Key format: tenant:dest:type -> count
    this.timeouts = {}; // Key format: tenant:dest -> count
    this.cbTrips = {}; // Key format: dest -> count
    this.cbStates = {}; // Key format: dest -> state (Closed=0, HalfOpen=1, Open=2)

    // Circuit Breaker Telemetry Extensions
    this.cbFailures = {}; // Key: dest -> count
    this.cbSuccesses = {}; // Key: dest -> count
    this.cbRecoveryAttempts = {}; // Key: dest -> count
    this.cbHalfOpenAttempts = {}; // Key: dest -> count
    this.cbTransitions = {}; // Key: dest -> count
    this.cbOpenTimestamps = {}; // Key: dest -> timestamp
    this.cbRecoveryTimes = {}; // Key: dest -> Array of ms

    // Cache Metrics
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.snapshotVersion = 1;
    this.snapshotCreatedAt = Date.now();
    this.snapshotReloads = 0;
    this.snapshotCompileDurationMs = 0;
    this.registryReloads = 0;
    this.registryReloadFailures = 0;
    this.activeServicesCount = 0;

    // FSM State Metrics
    this.currentState = 'BOOTING';
    this.transitionsCount = 0;
    this.startTime = Date.now();
  }

  recordStateTransition(oldState, newState) {
    this.currentState = newState;
    this.transitionsCount++;
  }

  recordRequest(tenant, source, dest, code, durationMs) {
    const reqKey = `${tenant}:${source}:${dest}:${code}`;
    this.requests[reqKey] = (this.requests[reqKey] || 0) + 1;

    const durKey = `${tenant}:${source}:${dest}`;
    this.durationSum[durKey] = (this.durationSum[durKey] || 0) + durationMs;
    this.durationCount[durKey] = (this.durationCount[durKey] || 0) + 1;
  }

  recordRetry(tenant, dest, type) {
    const key = `${tenant}:${dest}:${type}`;
    this.retries[key] = (this.retries[key] || 0) + 1;
  }

  recordTimeout(tenant, dest) {
    const key = `${tenant}:${dest}`;
    this.timeouts[key] = (this.timeouts[key] || 0) + 1;
  }

  recordCircuitBreakerTrip(dest) {
    this.cbTrips[dest] = (this.cbTrips[dest] || 0) + 1;
  }

  recordCircuitBreakerState(dest, state) {
    const oldStateVal = this.cbStates[dest];
    let val = 0;
    if (state === 'Half-Open') val = 1;
    else if (state === 'Open') val = 2;

    this.cbStates[dest] = val;
    this.cbTransitions[dest] = (this.cbTransitions[dest] || 0) + 1;

    if (state === 'Open') {
      this.cbOpenTimestamps[dest] = Date.now();
    } else if (oldStateVal === 2 && (state === 'Closed' || state === 'Half-Open')) {
      const openTime = this.cbOpenTimestamps[dest];
      if (openTime) {
        const recoveryTime = Date.now() - openTime;
        if (!this.cbRecoveryTimes[dest]) this.cbRecoveryTimes[dest] = [];
        this.cbRecoveryTimes[dest].push(recoveryTime);
      }
    }

    if (state === 'Half-Open') {
      this.cbHalfOpenAttempts[dest] = (this.cbHalfOpenAttempts[dest] || 0) + 1;
      this.cbRecoveryAttempts[dest] = (this.cbRecoveryAttempts[dest] || 0) + 1;
    }
  }

  recordCircuitBreakerFailure(dest) {
    this.cbFailures[dest] = (this.cbFailures[dest] || 0) + 1;
  }

  recordCircuitBreakerSuccess(dest) {
    this.cbSuccesses[dest] = (this.cbSuccesses[dest] || 0) + 1;
  }

  // Cache record helpers
  recordCacheHit() { this.cacheHits++; }
  recordCacheMiss() { this.cacheMisses++; }
  setSnapshotInfo(version, createdAt) {
    this.snapshotVersion = version;
    this.snapshotCreatedAt = createdAt;
  }
  recordSnapshotReload() { this.snapshotReloads++; }
  recordSnapshotCompileDuration(durationMs) { this.snapshotCompileDurationMs = durationMs; }
  recordRegistryReload(success) {
    if (success) this.registryReloads++;
    else this.registryReloadFailures++;
  }
  setActiveServicesCount(count) { this.activeServicesCount = count; }

  getAverageRecoveryTime(dest) {
    const list = this.cbRecoveryTimes[dest];
    if (!list || list.length === 0) return 0;
    const sum = list.reduce((a, b) => a + b, 0);
    return (sum / list.length) / 1000.0; // returns in seconds
  }

  toPrometheusString() {
    let out = '';

    // 1. HTTP Requests Total
    out += '# HELP sj_mesh_requests_total Total internal HTTP requests routed through the mesh\n';
    out += '# TYPE sj_mesh_requests_total counter\n';
    for (const [key, count] of Object.entries(this.requests)) {
      const [tenant, source, dest, code] = key.split(':');
      out += `sj_mesh_requests_total{tenant="${tenant}",source="${source}",destination="${dest}",status_code="${code}"} ${count}\n`;
    }
    out += '\n';

    // 2. Request Duration Seconds Sum
    out += '# HELP sj_mesh_request_duration_seconds_sum Total request latency sum in seconds\n';
    out += '# TYPE sj_mesh_request_duration_seconds_sum counter\n';
    for (const [key, sumMs] of Object.entries(this.durationSum)) {
      const [tenant, source, dest] = key.split(':');
      const sumSec = sumMs / 1000.0;
      out += `sj_mesh_request_duration_seconds_sum{tenant="${tenant}",source="${source}",destination="${dest}"} ${sumSec.toFixed(4)}\n`;
    }
    out += '\n';

    // 3. Request Duration Seconds Count
    out += '# HELP sj_mesh_request_duration_seconds_count Total requests counted for latency\n';
    out += '# TYPE sj_mesh_request_duration_seconds_count counter\n';
    for (const [key, count] of Object.entries(this.durationCount)) {
      const [tenant, source, dest] = key.split(':');
      out += `sj_mesh_request_duration_seconds_count{tenant="${tenant}",source="${source}",destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    // 4. Retries Total
    out += '# HELP sj_mesh_retries_total Total retry requests executed\n';
    out += '# TYPE sj_mesh_retries_total counter\n';
    for (const [key, count] of Object.entries(this.retries)) {
      const [tenant, dest, type] = key.split(':');
      out += `sj_mesh_retries_total{tenant="${tenant}",destination="${dest}",backoff_type="${type}"} ${count}\n`;
    }
    out += '\n';

    // 5. Timeouts Total
    out += '# HELP sj_mesh_timeouts_total Total request timeouts enforced\n';
    out += '# TYPE sj_mesh_timeouts_total counter\n';
    for (const [key, count] of Object.entries(this.timeouts)) {
      const [tenant, dest] = key.split(':');
      out += `sj_mesh_timeouts_total{tenant="${tenant}",destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    // 6. Circuit Breaker Trips Total
    out += '# HELP sj_mesh_circuit_breaker_trips_total Total times a service circuit breaker tripped to Open\n';
    out += '# TYPE sj_mesh_circuit_breaker_trips_total counter\n';
    for (const [dest, count] of Object.entries(this.cbTrips)) {
      out += `sj_mesh_circuit_breaker_trips_total{destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    // 7. Circuit Breaker States
    out += '# HELP sj_mesh_circuit_breaker_states Active circuit breaker state (0=Closed, 1=Half-Open, 2=Open)\n';
    out += '# TYPE sj_mesh_circuit_breaker_states gauge\n';
    for (const [dest, val] of Object.entries(this.cbStates)) {
      out += `sj_mesh_circuit_breaker_states{destination="${dest}"} ${val}\n`;
    }
    out += '\n';

    // CB Detailed Metrics
    out += '# HELP sj_mesh_circuit_breaker_failures_total Total circuit breaker failures recorded\n';
    out += '# TYPE sj_mesh_circuit_breaker_failures_total counter\n';
    for (const [dest, count] of Object.entries(this.cbFailures)) {
      out += `sj_mesh_circuit_breaker_failures_total{destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    out += '# HELP sj_mesh_circuit_breaker_successes_total Total circuit breaker successes recorded\n';
    out += '# TYPE sj_mesh_circuit_breaker_successes_total counter\n';
    for (const [dest, count] of Object.entries(this.cbSuccesses)) {
      out += `sj_mesh_circuit_breaker_successes_total{destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    out += '# HELP sj_mesh_circuit_breaker_recovery_attempts_total Total recovery attempts initiated\n';
    out += '# TYPE sj_mesh_circuit_breaker_recovery_attempts_total counter\n';
    for (const [dest, count] of Object.entries(this.cbRecoveryAttempts)) {
      out += `sj_mesh_circuit_breaker_recovery_attempts_total{destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    out += '# HELP sj_mesh_circuit_breaker_half_open_attempts_total Total transitions to half-open state\n';
    out += '# TYPE sj_mesh_circuit_breaker_half_open_attempts_total counter\n';
    for (const [dest, count] of Object.entries(this.cbHalfOpenAttempts)) {
      out += `sj_mesh_circuit_breaker_half_open_attempts_total{destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    out += '# HELP sj_mesh_circuit_breaker_transitions_total Total state transitions occurred\n';
    out += '# TYPE sj_mesh_circuit_breaker_transitions_total counter\n';
    for (const [dest, count] of Object.entries(this.cbTransitions)) {
      out += `sj_mesh_circuit_breaker_transitions_total{destination="${dest}"} ${count}\n`;
    }
    out += '\n';

    out += '# HELP sj_mesh_circuit_breaker_average_recovery_time_seconds Average recovery time in seconds\n';
    out += '# TYPE sj_mesh_circuit_breaker_average_recovery_time_seconds gauge\n';
    for (const dest of Object.keys(this.cbStates)) {
      out += `sj_mesh_circuit_breaker_average_recovery_time_seconds{destination="${dest}"} ${this.getAverageRecoveryTime(dest).toFixed(4)}\n`;
    }
    out += '\n';

    // Cache Metrics
    out += '# HELP sj_mesh_cache_hits_total Total runtime cache hits\n';
    out += '# TYPE sj_mesh_cache_hits_total counter\n';
    out += `sj_mesh_cache_hits_total ${this.cacheHits}\n\n`;

    out += '# HELP sj_mesh_cache_misses_total Total runtime cache misses\n';
    out += '# TYPE sj_mesh_cache_misses_total counter\n';
    out += `sj_mesh_cache_misses_total ${this.cacheMisses}\n\n`;

    out += '# HELP sj_mesh_snapshot_version Active snapshot version\n';
    out += '# TYPE sj_mesh_snapshot_version gauge\n';
    out += `sj_mesh_snapshot_version ${this.snapshotVersion}\n\n`;

    out += '# HELP sj_mesh_snapshot_age_seconds Seconds elapsed since snapshot creation\n';
    out += '# TYPE sj_mesh_snapshot_age_seconds gauge\n';
    const age = Math.max(0, Math.floor((Date.now() - this.snapshotCreatedAt) / 1000));
    out += `sj_mesh_snapshot_age_seconds ${age}\n\n`;

    out += '# HELP sj_mesh_snapshot_reloads_total Total reloads of snapshots performed\n';
    out += '# TYPE sj_mesh_snapshot_reloads_total counter\n';
    out += `sj_mesh_snapshot_reloads_total ${this.snapshotReloads}\n\n`;

    out += '# HELP sj_mesh_snapshot_compile_duration_seconds Compile duration of the snapshot in seconds\n';
    out += '# TYPE sj_mesh_snapshot_compile_duration_seconds gauge\n';
    out += `sj_mesh_snapshot_compile_duration_seconds ${(this.snapshotCompileDurationMs / 1000.0).toFixed(4)}\n\n`;

    out += '# HELP sj_registry_reloads_total Total control plane registry reloads\n';
    out += '# TYPE sj_registry_reloads_total counter\n';
    out += `sj_registry_reloads_total ${this.registryReloads}\n\n`;

    out += '# HELP sj_registry_reload_failures_total Total registry reload failures\n';
    out += '# TYPE sj_registry_reload_failures_total counter\n';
    out += `sj_registry_reload_failures_total ${this.registryReloadFailures}\n\n`;

    out += '# HELP sj_mesh_active_services Active services registered in cache\n';
    out += '# TYPE sj_mesh_active_services gauge\n';
    out += `sj_mesh_active_services ${this.activeServicesCount}\n\n`;

    out += '# HELP sj_mesh_cache_memory_bytes Memory usage of runtime cache in bytes\n';
    out += '# TYPE sj_mesh_cache_memory_bytes gauge\n';
    const memoryUsage = process.memoryUsage().heapUsed;
    out += `sj_mesh_cache_memory_bytes ${memoryUsage}\n\n`;

    // State machine metrics
    const StateValues = {
      BOOTING: 1, LOADING: 2, READY: 3, RELOADING: 4,
      DEGRADED: 5, RECOVERING: 6, FAILED: 7, STOPPING: 8, STOPPED: 9
    };
    const stateVal = StateValues[this.currentState] || 0;
    out += '# HELP runtime_state Active runtime lifecycle state\n';
    out += '# TYPE runtime_state gauge\n';
    out += `runtime_state{state="${this.currentState}"} ${stateVal}\n\n`;

    out += '# HELP runtime_transitions_total Total state transitions executed\n';
    out += '# TYPE runtime_transitions_total counter\n';
    out += `runtime_transitions_total ${this.transitionsCount}\n\n`;

    out += '# HELP runtime_uptime_seconds Seconds elapsed since runtime startup\n';
    out += '# TYPE runtime_uptime_seconds gauge\n';
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    out += `runtime_uptime_seconds ${uptime}\n\n`;

    return out;
  }
}

const globalMetrics = new TelemetryRegistry();

module.exports = {
  TelemetryRegistry,
  globalMetrics
};
