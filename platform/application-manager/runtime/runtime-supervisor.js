const { RuntimeMonitor } = require('./runtime-monitor');
const { RuntimeRecovery } = require('./runtime-recovery');
const { globalRuntimeState } = require('./runtime-state');

class RuntimeSupervisor {
  constructor(tenantsDir) {
    this.monitor = new RuntimeMonitor();
    this.recovery = new RuntimeRecovery(tenantsDir);
    this.intervalId = null;
    this.monitoredApps = new Map(); // appId -> { tenantId, containerName }
  }

  registerApp(appId, tenantId, containerName) {
    this.monitoredApps.set(appId, { tenantId, containerName });
  }

  unregisterApp(appId) {
    this.monitoredApps.delete(appId);
  }

  start(intervalMs = 10000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async tick() {
    for (const [appId, info] of this.monitoredApps.entries()) {
      const { tenantId, containerName } = info;
      const isRunning = this.monitor.isContainerRunning(containerName);
      
      const desiredState = globalRuntimeState.get(appId);
      
      if (desiredState === 'RUNNING' && !isRunning) {
        console.warn(`[RuntimeSupervisor] Crash detected for application ${appId} (Container: ${containerName})! Recovering...`);
        await this.recovery.recover(tenantId, appId);
      }
    }
  }
}

const globalRuntimeSupervisor = new RuntimeSupervisor();

module.exports = {
  RuntimeSupervisor,
  globalRuntimeSupervisor
};
