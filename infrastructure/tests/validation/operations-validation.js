const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { globalLogManager } = require('../../../platform/logging/log-manager');
const { globalTraceManager } = require('../../../platform/tracing/trace-manager');
const { globalAlertEngine } = require('../../../platform/alerts/alert-engine');
const { globalIncidentManager } = require('../../../platform/incidents/incident-manager');
const { globalDiagnosticsManager } = require('../../../platform/diagnostics/diagnostics-manager');
const { globalDashboardApi } = require('../../../platform/dashboard/dashboard-api');
const { globalBackupChecker } = require('../../../platform/backups/backup-checker');
const { globalProfiler } = require('../../../platform/profiler/profiler');
const { globalCapacityManager } = require('../../../platform/capacity/capacity-manager');
const { globalHealthScore } = require('../../../platform/health-score/health-score');
const { handleOperationsRoute } = require('../../../platform/tenant-manager/api/operations-api');

async function runTests() {
  console.log('🧪 Running SRE Observability & Platform Operations validation...');

  try {
    // 1. Structured Logging Validation
    console.log('--- Testing Structured Logging ---');
    globalLogManager.info('service', 'Operational status normal', { tenantId: 't1', appId: 'a1' });
    const logs = globalLogManager.search({ tenantId: 't1' });
    assert.strictEqual(logs.length > 0, true);
    assert.strictEqual(logs[0].level, 'INFO');
    assert.strictEqual(logs[0].message, 'Operational status normal');
    assert.strictEqual(logs[0].scope, 'service');

    // Test log rotation triggers
    const rotationPath = path.resolve(__dirname, '../../../storage/logs/platform.log');
    assert.strictEqual(fs.existsSync(rotationPath), true);

    // 2. Distributed Tracing (W3C traceparent context)
    console.log('--- Testing Distributed Tracing ---');
    const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const span = globalTraceManager.startSpan('mesh-route-check', header);
    assert.strictEqual(span.traceId, '4bf92f3577b34da6a3ce929d0e0e4736');
    assert.strictEqual(span.parentSpanId, '00f067aa0ba902b7');
    
    span.setAttribute('peer.service', 'auth-service').setStatus('OK').end();
    
    const trace = globalTraceManager.getTrace('4bf92f3577b34da6a3ce929d0e0e4736');
    assert.strictEqual(trace.length, 1);
    assert.strictEqual(trace[0].name, 'mesh-route-check');
    assert.strictEqual(trace[0].status, 'OK');

    // 3. Alert Rules Evaluation
    console.log('--- Testing Alert Engine ---');
    const cpuState = { cpu: 85, memory: 50 };
    const alert = globalAlertEngine.evaluateState('high-cpu', cpuState, { message: 'High CPU detected' });
    assert.ok(alert);
    assert.strictEqual(alert.severity, 'WARNING');
    assert.strictEqual(alert.title, 'High CPU Utilization');

    const criticalState = { cpu: 40, memory: 92 };
    const criticalAlert = globalAlertEngine.evaluateState('high-memory', criticalState, { message: 'High Memory' });
    assert.ok(criticalAlert);
    assert.strictEqual(criticalAlert.severity, 'WARNING');

    // 4. Incident Management FSM Transitions
    console.log('--- Testing Incident Management FSM ---');
    const incident = globalIncidentManager.createIncident('Kubernetes node pressure', 'CRITICAL', 'Node node-1 disk pressure');
    assert.strictEqual(incident.state, 'OPEN');

    // Transition valid
    globalIncidentManager.transitionIncident(incident.id, 'ACKNOWLEDGED', 'Acknowledged by on-call');
    assert.strictEqual(globalIncidentManager.getIncident(incident.id).state, 'ACKNOWLEDGED');

    // Transition invalid (ACKNOWLEDGED -> CLOSED is valid, but ACKNOWLEDGED -> OPEN is invalid)
    assert.throws(() => {
      globalIncidentManager.transitionIncident(incident.id, 'OPEN', 'Backtrack state');
    }, /Invalid incident transition/);

    // 5. Backup Verification Engine
    console.log('--- Testing Backup Verification ---');
    const mockBackup = {
      id: 'bak-992',
      type: 'tenant',
      path: '/home/bokeh/Projects/sj-cloud/storage/backups/t1-db.tar.gz',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    };
    const backupRes = globalBackupChecker.verifyBackup(mockBackup);
    assert.strictEqual(backupRes.status, 'SUCCESS');
    assert.strictEqual(globalBackupChecker.getHistory().length > 0, true);

    // 6. Diagnostics & Profiler
    console.log('--- Testing Diagnostics & Profiler ---');
    const diagReport = globalDiagnosticsManager.runFullDiagnostics();
    assert.strictEqual(diagReport.overallStatus, 'HEALTHY');
    assert.ok(diagReport.runtime);
    assert.ok(diagReport.storage);

    const profile = globalProfiler.getProfile();
    assert.ok(profile.cpu);
    assert.ok(profile.memory);
    assert.ok(profile.eventLoop);

    // 7. Capacity Planning & Health Scores
    console.log('--- Testing Capacity Forecast & Health Scores ---');
    const capacityReport = globalCapacityManager.getCapacityForecast();
    assert.ok(capacityReport.cpu);
    assert.ok(capacityReport.workloads);

    const health = globalHealthScore.getOverallScore();
    assert.ok(health.platform >= 0 && health.platform <= 100);

    // 8. REST Router Routing Delegation (Mock Req/Res test)
    console.log('--- Testing Operations HTTP API Routing ---');
    
    // Test GET /metrics
    const mockMetricsReq = { url: '/metrics', method: 'GET', headers: {} };
    let metricsBody = '';
    const mockMetricsRes = {
      setHeader: () => {},
      end: (data) => { metricsBody = data; }
    };
    const metricsRouted = await handleOperationsRoute(mockMetricsReq, mockMetricsRes);
    assert.strictEqual(metricsRouted, true);
    assert.ok(metricsBody.includes('# HELP sj_platform_health_score'));

    // Test GET /admin/dashboard
    const mockDashReq = { url: '/admin/dashboard', method: 'GET', headers: {} };
    let dashBody = '';
    const mockDashRes = {
      setHeader: () => {},
      end: (data) => { dashBody = data; }
    };
    const dashRouted = await handleOperationsRoute(mockDashReq, mockDashRes);
    assert.strictEqual(dashRouted, true);
    const parsedDash = JSON.parse(dashBody);
    assert.ok(parsedDash.summary);
    assert.ok(parsedDash.health);

    console.log('✅ All operations, metrics, logs, and alerting test assertions passed successfully!');
  } catch (err) {
    console.error('❌ Validation assertion failed:', err);
    process.exit(1);
  }
}

runTests();
