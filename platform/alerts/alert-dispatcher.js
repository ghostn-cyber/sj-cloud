const { globalLogManager } = require('../logging/log-manager');

class AlertDispatcher {
  dispatch(alert) {
    // Log the alert event as structured platform log
    globalLogManager.log(
      alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      'service',
      `[Alert] ${alert.title}: ${alert.message}`,
      { metadata: alert }
    );
  }
}

const globalAlertDispatcher = new AlertDispatcher();

module.exports = {
  AlertDispatcher,
  globalAlertDispatcher
};
