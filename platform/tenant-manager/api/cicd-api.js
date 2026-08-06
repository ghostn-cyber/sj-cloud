const { globalRepositoryRegistry } = require('../../repository-manager/registry/repository-registry');
const { globalRepositorySync } = require('../../repository-manager/sync/repository-sync');
const { globalPipelineEngine } = require('../../pipeline-engine/pipeline-engine');
const { globalLogManager } = require('../../pipeline-engine/logs/log-manager');
const { globalSecretManager } = require('../../secrets/secret-manager');
const { globalEnvironmentManager } = require('../../environments/environment-manager');
const { globalPromotionEngine } = require('../../environments/promotion-engine');
const { globalWebhookReceiver } = require('../../webhooks/webhook-receiver');

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

async function handleCICDRoute(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Global webhook receiver
  if (pathname === '/webhooks/git' && req.method === 'POST') {
    const bodyStr = await readBody(req);
    const result = await globalWebhookReceiver.handleWebhook(req.headers, bodyStr);
    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return true;
  }

  // Parse tenant-scoped routes: /tenants/{tenant_id}/...
  const tenantMatch = pathname.match(/^\/tenants\/([a-z0-9-]+)\/(.+)$/);
  if (!tenantMatch) return false;

  const tenantId = tenantMatch[1];
  const subPath = tenantMatch[2];

  // 2. Repository management routes
  if (subPath === 'repositories') {
    if (req.method === 'GET') {
      const repos = globalRepositoryRegistry.getAllRepositories().filter(r => r.tenant_id === tenantId);
      res.statusCode = 200;
      res.end(JSON.stringify(repos));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const config = JSON.parse(body);
      config.tenant_id = tenantId;
      const saved = globalRepositoryRegistry.saveRepository(config);
      res.statusCode = 201;
      res.end(JSON.stringify(saved));
      return true;
    }
  }

  const repoDetailMatch = subPath.match(/^repositories\/([a-z0-9-]+)$/);
  if (repoDetailMatch) {
    const repoId = repoDetailMatch[1];
    if (req.method === 'GET') {
      const repo = globalRepositoryRegistry.getRepository(repoId);
      if (!repo || repo.tenant_id !== tenantId) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Repository not found' }));
        return true;
      }
      res.statusCode = 200;
      res.end(JSON.stringify(repo));
      return true;
    }
    if (req.method === 'DELETE') {
      const deleted = globalRepositoryRegistry.deleteRepository(repoId);
      res.statusCode = deleted ? 200 : 404;
      res.end(JSON.stringify({ success: deleted }));
      return true;
    }
  }

  const repoSyncMatch = subPath.match(/^repositories\/([a-z0-9-]+)\/sync$/);
  if (repoSyncMatch && req.method === 'POST') {
    const repoId = repoSyncMatch[1];
    try {
      const result = await globalRepositorySync.sync(tenantId, repoId);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // 3. Pipeline triggers & runs
  if (subPath === 'pipelines/trigger' && req.method === 'POST') {
    const body = await readBody(req);
    const { application_id, branch, environment } = JSON.parse(body);
    try {
      const run = await globalPipelineEngine.triggerPipeline(tenantId, application_id, {
        type: 'manual',
        branch: branch || 'main',
        environment: environment || 'development'
      });
      res.statusCode = 200;
      res.end(JSON.stringify(run));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  if (subPath === 'pipelines/runs' && req.method === 'GET') {
    const runs = globalPipelineEngine.getAllPipelineRuns(tenantId);
    res.statusCode = 200;
    res.end(JSON.stringify(runs));
    return true;
  }

  const runDetailMatch = subPath.match(/^pipelines\/runs\/([a-z0-9-]+)$/);
  if (runDetailMatch && req.method === 'GET') {
    const runId = runDetailMatch[1];
    const run = globalPipelineEngine.getPipelineRun(tenantId, runId);
    if (!run) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Pipeline run not found' }));
      return true;
    }
    res.statusCode = 200;
    res.end(JSON.stringify(run));
    return true;
  }

  const runCancelMatch = subPath.match(/^pipelines\/runs\/([a-z0-9-]+)\/cancel$/);
  if (runCancelMatch && req.method === 'POST') {
    const runId = runCancelMatch[1];
    try {
      const run = globalPipelineEngine.cancelPipelineRun(tenantId, runId);
      res.statusCode = 200;
      res.end(JSON.stringify(run));
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // 4. Build Logs
  const runLogsMatch = subPath.match(/^pipelines\/runs\/([a-z0-9-]+)\/logs$/);
  if (runLogsMatch && req.method === 'GET') {
    const runId = runLogsMatch[1];
    const logs = globalLogManager.getLogs(tenantId, runId);
    res.statusCode = 200;
    res.end(JSON.stringify({ logs }));
    return true;
  }

  // 5. Secret management
  if (subPath === 'secrets') {
    if (req.method === 'GET') {
      const keys = globalSecretManager.getSecretKeys(tenantId);
      res.statusCode = 200;
      res.end(JSON.stringify({ keys }));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const { name, value, scope, scope_id } = JSON.parse(body);
      globalSecretManager.saveSecret(tenantId, name, value, scope, scope_id);
      res.statusCode = 201;
      res.end(JSON.stringify({ success: true, name }));
      return true;
    }
  }

  const secretDetailMatch = subPath.match(/^secrets\/([A-Za-z0-9_-]+)$/);
  if (secretDetailMatch) {
    const secretName = secretDetailMatch[1];
    if (req.method === 'GET') {
      const value = globalSecretManager.getSecret(tenantId, secretName);
      if (value === null) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Secret not found' }));
        return true;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ name: secretName, value }));
      return true;
    }
    if (req.method === 'DELETE') {
      globalSecretManager.deleteSecret(tenantId, secretName);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return true;
    }
  }

  // 6. Promotions & Environments
  if (subPath === 'environments' && req.method === 'GET') {
    const envs = globalEnvironmentManager.getEnvironments();
    res.statusCode = 200;
    res.end(JSON.stringify(envs));
    return true;
  }

  if (subPath === 'promotions' && req.method === 'POST') {
    const body = await readBody(req);
    const { application_id, release_id, source_env, target_env } = JSON.parse(body);
    try {
      const result = await globalPromotionEngine.startPromotion(tenantId, application_id, release_id, source_env, target_env);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  const promoApproveMatch = subPath.match(/^promotions\/([a-z0-9-]+)\/approve$/);
  if (promoApproveMatch && req.method === 'POST') {
    const promoId = promoApproveMatch[1];
    const body = await readBody(req);
    const { approver } = JSON.parse(body);
    try {
      const result = await globalPromotionEngine.approvePromotion(promoId, approver || 'admin');
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  const promoRejectMatch = subPath.match(/^promotions\/([a-z0-9-]+)\/reject$/);
  if (promoRejectMatch && req.method === 'POST') {
    const promoId = promoRejectMatch[1];
    const body = await readBody(req);
    const { approver } = JSON.parse(body);
    try {
      const result = await globalPromotionEngine.rejectPromotion(promoId, approver || 'admin');
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  return false;
}

module.exports = {
  handleCICDRoute
};
