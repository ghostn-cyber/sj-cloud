class IncidentHistory {
  constructor() {
    this.history = [];
  }

  record(incidentId, transition) {
    this.history.push({
      incidentId,
      ...transition,
      timestamp: Date.now()
    });
  }

  getHistory(incidentId = null) {
    if (incidentId) {
      return this.history.filter(h => h.incidentId === incidentId);
    }
    return this.history;
  }
}

const globalIncidentHistory = new IncidentHistory();

module.exports = {
  IncidentHistory,
  globalIncidentHistory
};
