const { globalApplicationRegistry } = require('../registry/application-registry');
const { globalBuildEngine } = require('../build/build-engine');
const { globalDeploymentEngine } = require('../deployment/deployment-engine');
const { globalReleaseManager } = require('../releases/release-manager');
const { globalRollbackEngine } = require('../rollback/rollback-engine');
const { globalRuntimeManager } = require('../runtime/runtime-manager');
const { globalRuntimeState } = require('../runtime/runtime-state');
const { globalDeploymentHistory } = require('../deployment/deployment-history');
const { globalBuildHistory } = require('../build/build-history');
const { globalHealthHistory } = require('../health/health-history');
const { DeploymentFSM } = require('../state/deployment-fsm');
const { ValidationError, ApplicationError } = require('../../shared/errors');

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

async function handleApplicationRoute(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. POST /applications
  if (pathname === '/applications' && req.method === 'POST') {
    const bodyStr = await readBody(req);
    const config = JSON.parse(bodyStr);
    const result = globalApplicationRegistry.saveApplication(config);
    res.statusCode = 201;
    res.end(JSON.stringify(result));
    return true;
  }

  // 2. GET /applications
  if (pathname === '/applications' && req.method === 'GET') {
    const apps = globalApplicationRegistry.getAllApplications();
    res.statusCode = 200;
    res.end(JSON.stringify(apps));
    return true;
  }

  // Regex matching sub-routes /applications/{id}/...
  const match = pathname.match(/^\/applications\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
  if (match) {
    const appId = match[1];
    const action = match[2];

    const app = globalApplicationRegistry.getApplication(appId);
    if (!app && req.method !== 'PUT' && req.method !== 'DELETE') {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `Application not found: ${appId}` }));
      return true;
    }

    // GET /applications/{id}
    if (!action && req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify(app));
      return true;
    }

    // PUT /applications/{id}
    if (!action && req.method === 'PUT') {
      const bodyStr = await readBody(req);
      const config = { ...JSON.parse(bodyStr), application_id: appId };
      const result = globalApplicationRegistry.saveApplication(config);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return true;
    }

    // DELETE /applications/{id}
    if (!action && req.method === 'DELETE') {
      const success = globalApplicationRegistry.deleteApplication(appId);
      res.statusCode = success ? 200 : 404;
      res.end(JSON.stringify({ success }));
      return true;
    }

    // POST /applications/{id}/build
    if (action === 'build' && req.method === 'POST') {
      if (req.headers['x-pipeline-execution'] !== 'true') {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'GovernanceError', message: 'Direct invocation of Build Engine is prohibited. Builds must originate from a Pipeline.' }));
        return true;
      }
      const bodyStr = await readBody(req);
      const opts = bodyStr ? JSON.parse(bodyStr) : {};
      const result = await globalBuildEngine.runBuild(appId, app.tenant_id, opts);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return true;
    }

    // POST /applications/{id}/deploy
    if (action === 'deploy' && req.method === 'POST') {
      if (req.headers['x-pipeline-execution'] !== 'true') {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'GovernanceError', message: 'Direct invocation of Deployment Engine is prohibited. Deployments must originate from a Pipeline.' }));
        return true;
      }
      const bodyStr = await readBody(req);
      const { releaseId } = JSON.parse(bodyStr);
      const result = await globalDeploymentEngine.runDeployment(appId, app.tenant_id, releaseId);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return true;
    }

    // POST /applications/{id}/rollback
    if (action === 'rollback' && req.method === 'POST') {
      const bodyStr = await readBody(req);
      const { releaseId } = JSON.parse(bodyStr);
      const result = await globalRollbackEngine.runRollback(appId, app.tenant_id, releaseId);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return true;
    }

    // POST /applications/{id}/restart
    if (action === 'restart' && req.method === 'POST') {
      await globalRuntimeManager.restart(app.tenant_id, appId);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return true;
    }

    // POST /applications/{id}/scale
    if (action === 'scale' && req.method === 'POST') {
      const bodyStr = await readBody(req);
      const { replicas } = JSON.parse(bodyStr);
      app.scaling = app.scaling || {};
      app.scaling.min_replicas = replicas;
      app.scaling.max_replicas = replicas;
      globalApplicationRegistry.saveApplication(app, false);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, replicas }));
      return true;
    }

    // GET /applications/{id}/runtime
    if (action === 'runtime' && req.method === 'GET') {
      const status = globalRuntimeState.get(appId);
      res.statusCode = 200;
      res.end(JSON.stringify({ status }));
      return true;
    }

    // GET /applications/{id}/deployments
    if (action === 'deployments' && req.method === 'GET') {
      const history = globalDeploymentHistory.getHistory(appId);
      res.statusCode = 200;
      res.end(JSON.stringify(history));
      return true;
    }

    // GET /applications/{id}/releases
    if (action === 'releases' && req.method === 'GET') {
      const releases = globalReleaseManager.getReleases(app.tenant_id, appId);
      res.statusCode = 200;
      res.end(JSON.stringify(releases));
      return true;
    }

    // GET /applications/{id}/health
    if (action === 'health' && req.method === 'GET') {
      const history = globalHealthHistory.getHistory(appId);
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: history.length > 0 && history[history.length - 1].status === 'HEALTHY' ? 'HEALTHY' : 'UNHEALTHY',
        history
      }));
      return true;
    }

    // GET /applications/{id}/history
    if (action === 'history' && req.method === 'GET') {
      const history = globalApplicationRegistry.history.getHistory(app.tenant_id, appId);
      res.statusCode = 200;
      res.end(JSON.stringify(history));
      return true;
    }

    // GET /applications/{id}/events
    if (action === 'events' && req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify([]));
      return true;
    }

    // GET /applications/{id}/metrics
    if (action === 'metrics' && req.method === 'GET') {
      const metrics = DeploymentFSM.getMetrics();
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 200;
      res.end(`
# HELP sj_application_build_total Total application builds
# TYPE sj_application_build_total counter
sj_application_build_total{app_id="${appId}"} ${metrics.build_total}

# HELP sj_application_deployment_total Total application deployments
# TYPE sj_application_deployment_total counter
sj_application_deployment_total{app_id="${appId}"} ${metrics.deployment_total}

# HELP sj_application_deployment_failures Total application deployment failures
# TYPE sj_application_deployment_failures counter
sj_application_deployment_failures{app_id="${appId}"} ${metrics.deployment_failures}

# HELP sj_application_rollback_total Total application rollbacks
# TYPE sj_application_rollback_total counter
sj_application_rollback_total{app_id="${appId}"} ${metrics.rollback_total}
      `.trim());
      return true;
    }
  }

  return false;
}

module.exports = {
  handleApplicationRoute
};
