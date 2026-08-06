class DashboardEvents {
  getEvents() {
    let list = [];
    try {
      const { globalAlertEngine } = require('../alerts/alert-engine');
      list = globalAlertEngine.getHistory().slice(-5).map(a => ({
        type: 'ALERT',
        title: a.title,
        message: a.message,
        timestamp: a.timestamp
      }));
    } catch (e) {}

    return list;
  }
}

const globalDashboardEvents = new DashboardEvents();

module.exports = {
  DashboardEvents,
  globalDashboardEvents
};
