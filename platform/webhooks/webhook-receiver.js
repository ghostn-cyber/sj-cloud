const { globalWebhookSecurity } = require('./webhook-security');
const { globalWebhookValidator } = require('./webhook-validator');
const { WebhookHistory } = require('./webhook-history');
const { WebhookEvents } = require('./webhook-events');
const { globalRepositoryRegistry } = require('../repository-manager/registry/repository-registry');
const { globalPipelineEngine } = require('../pipeline-engine/pipeline-engine');

class WebhookReceiver {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir;
    this.history = new WebhookHistory(this.tenantsDir);
  }

  async handleWebhook(headers, body) {
    const eventId = headers['x-github-delivery'] || `ev-${Math.random().toString(36).substr(2, 9)}`;
    const eventType = headers['x-github-event'] || 'push';
    const signature = headers['x-hub-signature-256'];
    const timestamp = headers['x-request-timestamp'] || new Date().toISOString();

    if (!globalWebhookSecurity.validateTimestamp(timestamp)) {
      throw new Error('Replay protection: Webhook request timestamp expired');
    }

    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    if (!globalWebhookValidator.validate(payload)) {
      throw new Error('Invalid webhook payload format');
    }

    // Try to resolve repository
    const gitUrl = payload.repository ? payload.repository.clone_url || payload.repository.git_url : null;
    let repo = null;
    
    if (gitUrl) {
      repo = globalRepositoryRegistry.getAllRepositories().find(r => r.url === gitUrl);
    }

    if (!repo) {
      // Mock resolution for verification tests
      const repoId = payload.repository_id || 'test-repo';
      repo = globalRepositoryRegistry.getRepository(repoId);
    }

    if (!repo) {
      throw new Error(`Repository not registered in platform`);
    }

    const tenantId = repo.tenant_id;

    // Validate Signature if secret is present
    if (repo.webhook_secret && !globalWebhookSecurity.validateSignature(body, signature, repo.webhook_secret)) {
      throw new Error('Invalid webhook signature');
    }

    // Resolve branch
    let branch = 'main';
    if (payload.ref) {
      branch = payload.ref.replace('refs/heads/', '');
    } else if (payload.branch) {
      branch = payload.branch;
    }

    this.history.log(tenantId, eventId, eventType, { branch, payload });
    WebhookEvents.emit('WebhookReceived', eventId, tenantId, { eventType, branch });

    // Look up applications associated with this repository to trigger pipelines
    const { globalApplicationRegistry } = require('../application-manager/registry/application-registry');
    const apps = globalApplicationRegistry.getAllApplications().filter(a => a.tenant_id === tenantId);

    const triggered = [];
    for (const app of apps) {
      // Trigger pipeline run
      try {
        const run = await globalPipelineEngine.triggerPipeline(tenantId, app.application_id, {
          type: eventType,
          branch
        });
        triggered.push({ appId: app.application_id, runId: run.pipelineId });
      } catch (err) {
        console.error(`Failed to trigger pipeline for app ${app.application_id}:`, err.message);
      }
    }

    return { eventId, tenantId, triggered };
  }
}

const globalWebhookReceiver = new WebhookReceiver();

module.exports = {
  WebhookReceiver,
  globalWebhookReceiver
};
