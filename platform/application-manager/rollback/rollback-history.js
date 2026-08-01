class RollbackHistory {
  constructor() {
    this.history = [];
  }

  record(appId, releaseId, status, details = {}) {
    this.history.push({
      timestamp: new Date().toISOString(),
      appId,
      releaseId,
      status,
      ...details
    });
  }

  getHistory(appId) {
    return this.history.filter(h => h.appId === appId);
  }
}

const globalRollbackHistory = new RollbackHistory();

module.exports = {
  RollbackHistory,
  globalRollbackHistory
};
