const { globalEventBus } = require('../service-mesh/events/event-bus');

class IncidentEvents {
  emitIncidentOpened(incident) {
    globalEventBus.publish('INCIDENT_OPENED', {
      incidentId: incident.id,
      title: incident.title,
      severity: incident.severity,
      timestamp: Date.now()
    });
  }

  emitIncidentStateChanged(incident, oldState, newState) {
    globalEventBus.publish('INCIDENT_STATE_CHANGED', {
      incidentId: incident.id,
      oldState,
      newState,
      timestamp: Date.now()
    });
  }

  emitIncidentResolved(incident) {
    globalEventBus.publish('INCIDENT_RESOLVED', {
      incidentId: incident.id,
      title: incident.title,
      timestamp: Date.now()
    });
  }
}

const globalIncidentEvents = new IncidentEvents();

module.exports = {
  IncidentEvents,
  globalIncidentEvents
};
