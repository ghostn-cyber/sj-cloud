const { globalAlertEngine } = require('../../alerts/alert-engine');
const { globalIncidentManager } = require('../../incidents/incident-manager');
const { globalLogManager } = require('../../logging/log-manager');
const { globalTraceManager } = require('../../tracing/trace-manager');
const { globalMetricsManager } = require('../../monitoring/metrics-manager');
const { globalDashboardApi } = require('../../dashboard/dashboard-api');
const { globalDiagnosticsManager } = require('../../diagnostics/diagnostics-manager');
const { globalHealthScore } = require('../../health-score/health-score');
const { globalProfiler } = require('../../profiler/profiler');
const { globalCapacityManager } = require('../../capacity/capacity-manager');
const { globalBackupChecker } = require('../../backups/backup-checker');

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

async function handleOperationsRoute(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/metrics' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.statusCode = 200;
    res.end(globalMetricsManager.getPrometheusFormat());
    return true;
  }

  if (!pathname.startsWith('/admin/')) return false;
  const adminSub = pathname.substring(7);

  if (adminSub === 'dashboard' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDashboardApi.getDashboardData()));
    return true;
  }

  if (adminSub === 'alerts') {
    if (req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify(globalAlertEngine.getHistory()));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const { ruleId, state, context } = JSON.parse(body);
      const alert = globalAlertEngine.evaluateState(ruleId, state, context);
      res.statusCode = alert ? 200 : 204;
      res.end(JSON.stringify({ triggered: !!alert, alert }));
      return true;
    }
  }

  if (adminSub === 'incidents') {
    if (req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify(globalIncidentManager.getAllIncidents()));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const { title, severity, description, alertId } = JSON.parse(body);
      const incident = globalIncidentManager.createIncident(title, severity, description, alertId);
      res.statusCode = 201;
      res.end(JSON.stringify(incident));
      return true;
    }
  }

  const incidentDetailMatch = adminSub.match(/^incidents\/([a-z0-9-]+)$/);
  if (incidentDetailMatch && req.method === 'POST') {
    const incidentId = incidentDetailMatch[1];
    const body = await readBody(req);
    const { state, reason } = JSON.parse(body);
    try {
      const transitioned = globalIncidentManager.transitionIncident(incidentId, state, reason);
      res.statusCode = 200;
      res.end(JSON.stringify(transitioned));
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  if (adminSub === 'logs' && req.method === 'GET') {
    const q = parsedUrl.searchParams.get('q') || '';
    const level = parsedUrl.searchParams.get('level') || '';
    const scope = parsedUrl.searchParams.get('scope') || '';
    const logs = globalLogManager.search({ query: q, level, scope });
    res.statusCode = 200;
    res.end(JSON.stringify(logs));
    return true;
  }

  if (adminSub === 'traces' && req.method === 'GET') {
    const traceId = parsedUrl.searchParams.get('traceId');
    if (traceId) {
      const trace = globalTraceManager.getTrace(traceId);
      res.statusCode = trace.length > 0 ? 200 : 404;
      res.end(JSON.stringify(trace));
    } else {
      res.statusCode = 200;
      res.end(JSON.stringify(globalTraceManager.getAllTraces()));
    }
    return true;
  }

  if (adminSub === 'diagnostics' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDiagnosticsManager.runFullDiagnostics()));
    return true;
  }
  if (adminSub === 'runtime' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDiagnosticsManager.getRuntime()));
    return true;
  }
  if (adminSub === 'network' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDiagnosticsManager.getNetwork()));
    return true;
  }
  if (adminSub === 'services' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDiagnosticsManager.getMesh()));
    return true;
  }
  if (adminSub === 'applications' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDiagnosticsManager.getApplications()));
    return true;
  }
  if (adminSub === 'pipelines' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDiagnosticsManager.getPipelines()));
    return true;
  }

  if (adminSub === 'health-score' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalHealthScore.getOverallScore()));
    return true;
  }

  if (adminSub === 'profiler' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalProfiler.getProfile()));
    return true;
  }

  if (adminSub === 'capacity' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalCapacityManager.getCapacityForecast()));
    return true;
  }

  if (adminSub === 'backups') {
    if (req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify(globalBackupChecker.getHistory()));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const backupSpec = JSON.parse(body);
      const result = globalBackupChecker.verifyBackup(backupSpec);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return true;
    }
  }

  return false;
}

module.exports = {
  handleOperationsRoute
};
