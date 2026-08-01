const http = require('http');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { globalTenantRegistry } = require('../registry/tenant-registry');
const { Provisioner } = require('../provisioning/provisioner');
const { LifecycleFSM, TenantStates } = require('../lifecycle/lifecycle-fsm');
const { TenantContext } = require('../runtime/runtime-context');

// Component 1-9 inclusions
const { globalPolicyEngine } = require('../policies/policy-engine');
const { globalDispatcher } = require('../queue/dispatcher');
const { globalQueue } = require('../queue/queue');
const { QueueWorker, queueMetrics } = require('../queue/worker');
const { Scheduler } = require('../reconciliation/scheduler');
const { AuditEvents } = require('../audit/audit-events');
const { AuditQuery } = require('../audit/audit-query');
const { ActualState } = require('../specification/actual-state');
const { DesiredState } = require('../specification/desired-state');
const { Watchdog } = require('../runtime/watchdog');
const { TenantReconciler } = require('../specification/tenant-reconciler');
const { SecretRotation, rotationMetrics } = require('../security/secret-rotation');
const { CertificateManager, certificateMetrics } = require('../security/certificate-manager');
const { handleApplicationRoute } = require('../../application-manager/api/application-api');

const PORT = process.env.PORT || 8083;
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const TENANTS_DIR = path.join(PROJECT_ROOT, 'tenants');

// Initialize background processors
const queueWorker = new QueueWorker(TENANTS_DIR);
queueWorker.start();

const scheduler = new Scheduler(TENANTS_DIR, 5000);
scheduler.start();

const auditEvents = new AuditEvents(TENANTS_DIR);
auditEvents.initialize();

const auditQuery = new AuditQuery(TENANTS_DIR);
const actualStateChecker = new ActualState(TENANTS_DIR);
const watchdog = new Watchdog(TENANTS_DIR);
const reconciler = new TenantReconciler(TENANTS_DIR);
const secretRotator = new SecretRotation(TENANTS_DIR);
const certManager = new CertificateManager();

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

function generatePrometheusMetrics(tenantId = null) {
  let body = '';
  const fsmMetrics = LifecycleFSM.getMetrics();
  const policyMetrics = globalPolicyEngine.constructor.getMetrics();
  const reconMetrics = reconciler.actualStateChecker.constructor ? reconciler.actualStateChecker.constructor.getMetrics ? reconciler.actualStateChecker.constructor.getMetrics() : { tenant_reconcile_total: 0, tenant_drift_total: 0, tenant_runtime_recoveries: 0 } : { tenant_reconcile_total: 0, tenant_drift_total: 0, tenant_runtime_recoveries: 0 };
  
  const activeCount = globalTenantRegistry.getAllTenants().filter(t => t.status === 'ACTIVE').length;
  const failedCount = globalTenantRegistry.getAllTenants().filter(t => t.status === 'FAILED').length;

  // Add global metrics
  body += `# HELP tenant_provision_total Total number of provisioning attempts\n`;
  body += `# TYPE tenant_provision_total counter\n`;
  body += `tenant_provision_total ${fsmMetrics.tenant_total || 0}\n`;

  body += `# HELP tenant_active_total Total number of active tenants\n`;
  body += `# TYPE tenant_active_total gauge\n`;
  body += `tenant_active_total ${activeCount}\n`;

  body += `# HELP tenant_failed_total Total number of failed tenants\n`;
  body += `# TYPE tenant_failed_total gauge\n`;
  body += `tenant_failed_total ${failedCount}\n`;

  body += `# HELP tenant_reconcile_total Total reconciliation sweeps\n`;
  body += `# TYPE tenant_reconcile_total counter\n`;
  body += `tenant_reconcile_total ${reconMetrics.tenant_reconcile_total || 0}\n`;

  body += `# HELP tenant_drift_total Total drift detections\n`;
  body += `# TYPE tenant_drift_total counter\n`;
  body += `tenant_drift_total ${reconMetrics.tenant_drift_total || 0}\n`;

  body += `# HELP tenant_queue_depth Current depth of provisioning queue\n`;
  body += `# TYPE tenant_queue_depth gauge\n`;
  body += `tenant_queue_depth ${queueMetrics.tenant_queue_depth || 0}\n`;

  body += `# HELP tenant_secret_rotations Total number of secret rotations\n`;
  body += `# TYPE tenant_secret_rotations counter\n`;
  body += `tenant_secret_rotations ${rotationMetrics.tenant_secret_rotations || 0}\n`;

  body += `# HELP tenant_runtime_recoveries Total auto-recoveries executed\n`;
  body += `# TYPE tenant_runtime_recoveries counter\n`;
  body += `tenant_runtime_recoveries ${reconMetrics.tenant_runtime_recoveries || 0}\n`;

  body += `# HELP tenant_policy_denials Total policy evaluation rejections\n`;
  body += `# TYPE tenant_policy_denials counter\n`;
  body += `tenant_policy_denials ${policyMetrics.tenant_policy_denials || 0}\n`;

  if (tenantId) {
    const certDays = certificateMetrics.tenant_certificate_expiry[tenantId] !== undefined ? certificateMetrics.tenant_certificate_expiry[tenantId] : 365;
    body += `# HELP tenant_certificate_expiry Days until SSL certificate expiry\n`;
    body += `# TYPE tenant_certificate_expiry gauge\n`;
    body += `tenant_certificate_expiry{tenant="${tenantId}"} ${certDays}\n`;
  }

  // Application-level metrics integration
  const { DeploymentFSM } = require('../../application-manager/state/deployment-fsm');
  const appMetrics = DeploymentFSM.getMetrics();
  body += `# HELP sj_application_build_total Total application builds\n`;
  body += `# TYPE sj_application_build_total counter\n`;
  body += `sj_application_build_total ${appMetrics.build_total || 0}\n`;

  body += `# HELP sj_application_deployment_total Total application deployments\n`;
  body += `# TYPE sj_application_deployment_total counter\n`;
  body += `sj_application_deployment_total ${appMetrics.deployment_total || 0}\n`;

  body += `# HELP sj_application_deployment_failures Total application deployment failures\n`;
  body += `# TYPE sj_application_deployment_failures counter\n`;
  body += `sj_application_deployment_failures ${appMetrics.deployment_failures || 0}\n`;

  body += `# HELP sj_application_rollback_total Total application rollbacks\n`;
  body += `# TYPE sj_application_rollback_total counter\n`;
  body += `sj_application_rollback_total ${appMetrics.rollback_total || 0}\n`;

  return body;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  res.setHeader('Content-Type', 'application/json');

  try {
    // Application Manager Route routing delegation
    try {
      if (await handleApplicationRoute(req, res)) {
        return;
      }
    } catch (routeErr) {
      res.statusCode = routeErr.statusCode || 500;
      return res.end(JSON.stringify({ error: routeErr.message }));
    }

    if (pathname === '/health' && req.method === 'GET') {
      res.statusCode = 200;
      return res.end(JSON.stringify({ status: 'UP' }));
    }

    // 1. /admin/tenants endpoint
    if (pathname === '/admin/tenants' && req.method === 'GET') {
      const tenants = globalTenantRegistry.getAllTenants();
      const summaries = tenants.map(t => {
        const actual = actualStateChecker.get(t.tenant_id);
        return {
          tenantId: t.tenant_id,
          status: t.status,
          primaryDomain: t.primary_domain,
          composeRunning: actual.composeRunning
        };
      });
      res.statusCode = 200;
      return res.end(JSON.stringify(summaries));
    }

    // 2. /admin/tenants/{id}/... diagnostics sub-routes
    const adminMatch = pathname.match(/^\/admin\/tenants\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
    if (adminMatch) {
      const tenantId = adminMatch[1];
      const subAction = adminMatch[2];

      const tenant = globalTenantRegistry.getTenant(tenantId);
      if (!tenant && subAction !== 'spec') {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: `Tenant not found: ${tenantId}` }));
      }

      if (!subAction && req.method === 'GET') {
        const actual = actualStateChecker.get(tenantId);
        const tasks = globalQueue.getTasksByTenant(tenantId);
        res.statusCode = 200;
        return res.end(JSON.stringify({
          spec: tenant,
          runtime: actual,
          tasks: tasks.map(t => ({ id: t.id, action: t.action, status: t.status, error: t.error }))
        }));
      }

      if (subAction === 'spec' && req.method === 'GET') {
        const spec = DesiredState.get(tenantId);
        if (!spec) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: `Specification not found for tenant: ${tenantId}` }));
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(spec));
      }

      if (subAction === 'audit' && req.method === 'GET') {
        const logs = auditQuery.getTenantAudit(tenantId);
        res.statusCode = 200;
        return res.end(JSON.stringify(logs));
      }

      if (subAction === 'events' && req.method === 'GET') {
        const history = globalTenantRegistry.history.getHistory(tenantId);
        res.statusCode = 200;
        return res.end(JSON.stringify(history));
      }

      if (subAction === 'history' && req.method === 'GET') {
        // Return version snapshot history
        const versions = globalTenantRegistry.version.getVersions ? globalTenantRegistry.version.getVersions(tenantId) : [];
        res.statusCode = 200;
        return res.end(JSON.stringify(versions));
      }

      if (subAction === 'runtime' && req.method === 'GET') {
        const actual = actualStateChecker.get(tenantId);
        res.statusCode = 200;
        return res.end(JSON.stringify({
          composeRunning: actual.composeRunning,
          containerStatus: actual.containerStatus,
          workspaceExists: actual.workspaceExists,
          dbExists: actual.dbExists
        }));
      }

      if (subAction === 'routing' && req.method === 'GET') {
        const routePath = path.resolve(PROJECT_ROOT, 'infrastructure/traefik/dynamic', `tenant-${tenantId}.yml`);
        if (fs.existsSync(routePath)) {
          const config = fs.readFileSync(routePath, 'utf8');
          res.statusCode = 200;
          return res.end(JSON.stringify({ file: routePath, content: config }));
        } else {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Routing file not found' }));
        }
      }

      if (subAction === 'health' && req.method === 'GET') {
        const health = await watchdog.checkTenantHealth(tenantId);
        res.statusCode = 200;
        return res.end(JSON.stringify(health));
      }

      if (subAction === 'metrics' && req.method === 'GET') {
        res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.statusCode = 200;
        return res.end(generatePrometheusMetrics(tenantId));
      }

      if (subAction === 'reconcile' && req.method === 'POST') {
        const result = await reconciler.reconcile(tenantId);
        res.statusCode = 200;
        return res.end(JSON.stringify(result));
      }

      if (subAction === 'rollback' && req.method === 'POST') {
        const body = await readBody(req);
        const { version } = JSON.parse(body);
        if (!version) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Missing version parameter' }));
        }
        
        globalPolicyEngine.evaluate('restore', tenantId);
        
        const task = globalDispatcher.dispatch(tenantId, 'rollback', { version });
        res.statusCode = 200;
        return res.end(JSON.stringify({ taskId: task.id, status: 'Queued' }));
      }
    }

    // 3. /tenants list and create
    if (pathname === '/tenants' && req.method === 'GET') {
      const tenants = globalTenantRegistry.getAllTenants();
      res.statusCode = 200;
      return res.end(JSON.stringify(tenants));
    }

    if (pathname === '/tenants' && req.method === 'POST') {
      const body = await readBody(req);
      const params = JSON.parse(body);
      if (!params.tenant_id) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Missing tenant_id' }));
      }

      // Check policies synchronously
      globalPolicyEngine.evaluate('provision', params.tenant_id, params);

      // Create initial creating config in registry
      const primaryDomain = params.primary_domain || `${params.tenant_id}.platform.test`;
      const initialConfig = {
        tenant_id: params.tenant_id,
        slug: params.slug || params.tenant_id,
        display_name: params.display_name || params.tenant_id,
        status: 'CREATING',
        primary_domain: primaryDomain,
        custom_domains: params.custom_domains || [],
        environment: params.environment || 'development',
        plan: params.plan || 'standard'
      };
      
      globalTenantRegistry.saveTenant(initialConfig, false);

      // Asynchronously provision
      globalDispatcher.dispatch(params.tenant_id, 'provision', params);

      res.statusCode = 201;
      return res.end(JSON.stringify(initialConfig));
    }

    // 4. /tenants/{id}/... backwards compatible lifecycle endpoints
    const match = pathname.match(/^\/tenants\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
    if (match) {
      const tenantId = match[1];
      const action = match[2];

      const tenant = globalTenantRegistry.getTenant(tenantId);
      if (!tenant && action !== 'rollback') {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: `Tenant not found: ${tenantId}` }));
      }

      const tenantDir = path.join(TENANTS_DIR, tenantId);

      if (!action && req.method === 'GET') {
        const secrets = fs.existsSync(path.join(tenantDir, 'secrets.json')) ? JSON.parse(fs.readFileSync(path.join(tenantDir, 'secrets.json'), 'utf8')) : {};
        const context = new TenantContext(tenant, secrets, tenantDir);
        res.statusCode = 200;
        return res.end(JSON.stringify(context));
      }

      if (!action && req.method === 'PUT') {
        const body = await readBody(req);
        const updates = JSON.parse(body);
        globalPolicyEngine.evaluate('update-domains', tenantId, updates);
        
        const merged = { ...tenant, ...updates, tenant_id: tenantId };
        globalTenantRegistry.saveTenant(merged);
        
        res.statusCode = 200;
        return res.end(JSON.stringify(merged));
      }

      if (!action && req.method === 'DELETE') {
        globalPolicyEngine.evaluate('delete', tenantId);
        globalDispatcher.dispatch(tenantId, 'delete');
        tenant.status = 'DELETING';
        globalTenantRegistry.saveTenant(tenant);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, status: 'DELETING' }));
      }

      if (action === 'start' && req.method === 'POST') {
        globalPolicyEngine.evaluate('start', tenantId);
        globalDispatcher.dispatch(tenantId, 'start');
        tenant.status = 'STARTING';
        globalTenantRegistry.saveTenant(tenant);
        res.statusCode = 200;
        return res.end(JSON.stringify(tenant));
      }

      if (action === 'stop' && req.method === 'POST') {
        globalPolicyEngine.evaluate('stop', tenantId);
        globalDispatcher.dispatch(tenantId, 'stop');
        tenant.status = 'SUSPENDED';
        globalTenantRegistry.saveTenant(tenant);
        res.statusCode = 200;
        return res.end(JSON.stringify(tenant));
      }

      if (action === 'archive' && req.method === 'POST') {
        globalPolicyEngine.evaluate('archive', tenantId);
        globalDispatcher.dispatch(tenantId, 'archive');
        tenant.status = 'ARCHIVED';
        globalTenantRegistry.saveTenant(tenant);
        res.statusCode = 200;
        return res.end(JSON.stringify(tenant));
      }

      if (action === 'restore' && req.method === 'POST') {
        globalPolicyEngine.evaluate('restore', tenantId);
        globalDispatcher.dispatch(tenantId, 'restore');
        tenant.status = 'RESTORING';
        globalTenantRegistry.saveTenant(tenant);
        res.statusCode = 200;
        return res.end(JSON.stringify(tenant));
      }

      if (action === 'rollback' && req.method === 'POST') {
        const body = await readBody(req);
        const { version } = JSON.parse(body);
        if (!version) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Missing version parameter' }));
        }

        globalPolicyEngine.evaluate('restore', tenantId);
        globalDispatcher.dispatch(tenantId, 'rollback', { version });
        
        res.statusCode = 200;
        return res.end(JSON.stringify({ status: 'UPDATING' }));
      }

      if (action === 'status' && req.method === 'GET') {
        const dockerStatus = globalTenantRegistry.status.getDockerStatus(tenantId);
        const summary = {
          tenantId,
          status: tenant.status,
          dockerStatus,
          plan: tenant.plan,
          primaryDomain: tenant.primary_domain
        };
        res.statusCode = 200;
        return res.end(JSON.stringify(summary));
      }

      if (action === 'events' && req.method === 'GET') {
        const history = globalTenantRegistry.history.getHistory(tenantId);
        res.statusCode = 200;
        return res.end(JSON.stringify(history));
      }

      if (action === 'metrics' && req.method === 'GET') {
        res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.statusCode = 200;
        return res.end(generatePrometheusMetrics(tenantId));
      }

      if (action === 'logs' && req.method === 'GET') {
        try {
          const logs = execSync('docker compose logs --tail=100', { cwd: tenantDir, stdio: 'pipe' }).toString();
          res.statusCode = 200;
          return res.end(JSON.stringify({ logs }));
        } catch {
          res.statusCode = 200;
          return res.end(JSON.stringify({ logs: 'No active container logs available.' }));
        }
      }
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  } catch (err) {
    console.error('API Error:', err.message);
    res.statusCode = err.name === 'PolicyError' ? 403 : 500;
    res.end(JSON.stringify({ error: err.name, message: err.message }));
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Administration Tenant Lifecycle API listening on port ${PORT}`);
  });
}

module.exports = {
  server,
  queueWorker,
  scheduler
};
