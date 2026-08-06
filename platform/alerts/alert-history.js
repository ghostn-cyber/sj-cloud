class AlertHistory {
  constructor(maxSize = 1000) {
    this.alerts = [];
    this.maxSize = maxSize;
  }

  record(alert) {
    this.alerts.push(alert);
    if (this.alerts.length > this.maxSize) {
      this.alerts.shift();
    }
  }

  getHistory() {
    return this.alerts;
  }

  clear() {
    this.alerts = [];
  }
}

const globalAlertHistory = new AlertHistory();

module.exports = {
  AlertHistory,
  globalAlertHistory
};
