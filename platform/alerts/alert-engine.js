const { AlertRule } = require('./alert-rule');
const { globalAlertValidator } = require('./alert-validator');
const { globalAlertHistory } = require('./alert-history');
const { globalAlertDispatcher } = require('./alert-dispatcher');
const { globalAlertEvents } = require('./alert-events');

class AlertEngine {
  constructor() {
    this.rules = new Map();
    this.initializeDefaultRules();
  }

  registerRule(rule) {
    this.rules.set(rule.id, rule);
  }

  initializeDefaultRules() {
    this.registerRule(new AlertRule('high-cpu', 'High CPU Utilization', (state) => {
      return state.cpu > 80;
    }, 'WARNING'));

    this.registerRule(new AlertRule('high-memory', 'High Memory Utilization', (state) => {
      return state.memory > 85;
    }, 'WARNING'));

    this.registerRule(new AlertRule('high-disk', 'High Disk Utilization', (state) => {
      return state.disk > 90;
    }, 'CRITICAL'));

    this.registerRule(new AlertRule('restart-loops', 'Restart Loop Detected', (state) => {
      return state.restartCount > 5;
    }, 'CRITICAL'));

    this.registerRule(new AlertRule('circuit-breaker-open', 'Circuit Breaker Open', (state) => {
      return state.circuitBreakerOpen === true;
    }, 'WARNING'));

    this.registerRule(new AlertRule('tenant-unhealthy', 'Tenant Unhealthy', (state) => {
      return state.tenantHealth === 'UNHEALTHY';
    }, 'CRITICAL'));

    this.registerRule(new AlertRule('app-unhealthy', 'Application Unhealthy', (state) => {
      return state.appHealth === 'UNHEALTHY';
    }, 'CRITICAL'));

    this.registerRule(new AlertRule('pipeline-failure', 'Pipeline Execution Failed', (state) => {
      return state.pipelineFailed === true;
    }, 'WARNING'));

    this.registerRule(new AlertRule('deployment-failure', 'Deployment Failed', (state) => {
      return state.deploymentFailed === true;
    }, 'CRITICAL'));

    this.registerRule(new AlertRule('backup-failure', 'Backup Verification Failed', (state) => {
      return state.backupFailed === true;
    }, 'WARNING'));

    this.registerRule(new AlertRule('cert-expiration', 'Certificate Expiring Soon', (state) => {
      return state.certDaysRemaining < 15;
    }, 'WARNING'));
  }

  evaluateState(ruleId, state, context = {}) {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new Error(`Alert rule not found: ${ruleId}`);

    if (rule.checkFn(state)) {
      const alert = {
        id: `alt-${Math.random().toString(36).substr(2, 9)}`,
        ruleId,
        title: rule.name,
        message: context.message || `Rule '${rule.name}' triggered on evaluated state.`,
        severity: rule.severity,
        timestamp: Date.now(),
        context
      };

      globalAlertValidator.validate(alert);
      globalAlertHistory.record(alert);
      globalAlertDispatcher.dispatch(alert);
      globalAlertEvents.emitAlertCreated(alert);

      if (rule.severity === 'CRITICAL') {
        try {
          const { globalIncidentManager } = require('../incidents/incident-manager');
          globalIncidentManager.createIncidentFromAlert(alert);
        } catch (e) {}
      }

      return alert;
    }
    return null;
  }

  getRules() {
    return Array.from(this.rules.values());
  }

  getHistory() {
    return globalAlertHistory.getHistory();
  }
}

const globalAlertEngine = new AlertEngine();

module.exports = {
  AlertEngine,
  globalAlertEngine
};
