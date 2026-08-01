class HealthHistory {
  constructor() {
    this.history = [];
  }

  record(appId, type, status, details = {}) {
    this.history.push({
      timestamp: new Date().toISOString(),
      appId,
      type, // 'liveness' or 'readiness'
      status, // 'HEALTHY' or 'UNHEALTHY'
      ...details
    });
  }

  getHistory(appId) {
    return this.history.filter(h => h.appId === appId);
  }
}

const globalHealthHistory = new HealthHistory();

module.exports = {
  HealthHistory,
  globalHealthHistory
};
