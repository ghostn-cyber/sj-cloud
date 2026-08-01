const { globalQueue } = require('./queue');
const { RetryPolicy } = require('./retry');
const { Provisioner } = require('../provisioning/provisioner');
const { globalTenantRegistry } = require('../registry/tenant-registry');
const { TenantEvents } = require('../registry/tenant-events');
const { LifecycleFSM, TenantStates } = require('../lifecycle/lifecycle-fsm');
const { execSync } = require('child_process');
const path = require('path');

const queueMetrics = {
  tenant_queue_depth: 0,
  tenant_queue_wait_time: []
};

class QueueWorker {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.provisioner = new Provisioner(this.tenantsDir);
    this.retryPolicy = new RetryPolicy();
    this.active = false;
    this.timer = null;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.runLoop();
  }

  stop() {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async runLoop() {
    if (!this.active) return;
    
    const pending = globalQueue.getPending();
    queueMetrics.tenant_queue_depth = pending.length;

    if (pending.length > 0) {
      const task = pending[0];
      await this.processTask(task);
    }

    this.timer = setTimeout(() => this.runLoop(), 1000);
    if (this.timer.unref) this.timer.unref();
  }

  async processTask(task) {
    task.attempts++;
    task.status = 'Running';
    task.startedAt = new Date().toISOString();
    
    const waitTime = Date.now() - new Date(task.queuedAt).getTime();
    queueMetrics.tenant_queue_wait_time.push(waitTime);

    console.log(`[QueueWorker] Processing task ${task.id} (${task.action}), attempt ${task.attempts}`);

    try {
      let result;
      
      if (task.action === 'provision') {
        result = await this.provisioner.provision(task.tenantId, task.params);
      } else {
        // Handle lifecycle actions
        const tenant = globalTenantRegistry.getTenant(task.tenantId);
        const tenantDir = path.join(this.tenantsDir, task.tenantId);
        
        if (task.action === 'start') {
          const fsm = new LifecycleFSM(task.tenantId, tenant.status);
          fsm.transitionTo(TenantStates.STARTING);
          try {
            execSync('docker compose start', { cwd: tenantDir, stdio: 'ignore' });
          } catch {
            execSync('docker compose up -d', { cwd: tenantDir, stdio: 'ignore' });
          }
          tenant.status = 'ACTIVE';
          globalTenantRegistry.saveTenant(tenant);
          fsm.transitionTo(TenantStates.ACTIVE);
          result = tenant;
        } else if (task.action === 'stop') {
          const fsm = new LifecycleFSM(task.tenantId, tenant.status);
          fsm.transitionTo(TenantStates.SUSPENDED);
          try {
            execSync('docker compose stop', { cwd: tenantDir, stdio: 'ignore' });
          } catch {}
          tenant.status = 'SUSPENDED';
          globalTenantRegistry.saveTenant(tenant);
          result = tenant;
        } else if (task.action === 'archive') {
          const fsm = new LifecycleFSM(task.tenantId, tenant.status);
          fsm.transitionTo(TenantStates.ARCHIVED);
          try {
            execSync('docker compose down -v', { cwd: tenantDir, stdio: 'ignore' });
          } catch {}
          tenant.status = 'ARCHIVED';
          globalTenantRegistry.saveTenant(tenant);
          result = tenant;
        } else if (task.action === 'restore') {
          const fsm = new LifecycleFSM(task.tenantId, tenant.status);
          fsm.transitionTo(TenantStates.RESTORING);
          try {
            execSync('docker compose up -d', { cwd: tenantDir, stdio: 'ignore' });
          } catch {}
          tenant.status = 'ACTIVE';
          globalTenantRegistry.saveTenant(tenant);
          fsm.transitionTo(TenantStates.ACTIVE);
          result = tenant;
        } else if (task.action === 'rollback') {
          const rolledBackConfig = globalTenantRegistry.version.rollbackTo(task.tenantId, task.params.version);
          rolledBackConfig.status = 'ACTIVE';
          globalTenantRegistry.saveTenant(rolledBackConfig);
          try {
            execSync('docker compose down -v && docker compose up -d', { cwd: tenantDir, stdio: 'ignore' });
          } catch {}
          result = rolledBackConfig;
        } else if (task.action === 'delete') {
          try {
            execSync('docker compose down -v', { cwd: tenantDir, stdio: 'ignore' });
          } catch {}
          this.provisioner.dnsGenerator.destroy(task.tenantId);
          this.provisioner.certificateGenerator.destroy(task.tenantId);
          globalTenantRegistry.deleteTenant(task.tenantId);
          this.provisioner.workspaceCreator.destroy(task.tenantId);
          result = { success: true };
        } else {
          throw new Error(`Unsupported queue action: ${task.action}`);
        }
      }

      task.status = 'Succeeded';
      task.result = result;
      task.completedAt = new Date().toISOString();
      console.log(`[QueueWorker] Task ${task.id} succeeded.`);
    } catch (err) {
      console.error(`[QueueWorker] Task ${task.id} failed:`, err.message);
      task.error = err.message;
      
      if (this.retryPolicy.shouldRetry(task)) {
        const delay = this.retryPolicy.getDelay(task);
        task.status = 'Queued'; // Requeue
        console.log(`[QueueWorker] Retrying task ${task.id} in ${delay}ms`);
      } else {
        task.status = 'Failed';
        task.completedAt = new Date().toISOString();
        globalQueue.moveToDLQ(task);
        console.log(`[QueueWorker] Task ${task.id} moved to Dead Letter Queue (DLQ).`);
        TenantEvents.emit('TENANT_PROVISION_FAILED', task.tenantId, { error: err.message });
      }
    }
  }

  static getMetrics() {
    return queueMetrics;
  }
}

module.exports = {
  QueueWorker,
  queueMetrics
};
