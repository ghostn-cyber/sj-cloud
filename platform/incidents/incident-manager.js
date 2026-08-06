const { IncidentStates, IncidentStateMachine } = require('./incident-state');
const { globalIncidentValidator } = require('./incident-validator');
const { globalIncidentHistory } = require('./incident-history');
const { globalIncidentEvents } = require('./incident-events');
const { globalLogManager } = require('../logging/log-manager');

class IncidentManager {
  constructor() {
    this.incidents = new Map();
  }

  createIncident(title, severity, description = '', alertId = null) {
    const id = `inc-${Math.random().toString(36).substr(2, 9)}`;
    const incident = {
      id,
      title,
      severity,
      description,
      alertId,
      state: IncidentStates.OPEN,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolvedAt: null
    };

    globalIncidentValidator.validate(incident);
    this.incidents.set(id, incident);

    globalIncidentHistory.record(id, { from: null, to: IncidentStates.OPEN, reason: 'Incident created' });
    globalIncidentEvents.emitIncidentOpened(incident);

    globalLogManager.critical('service', `[Incident OPENED] ${title} (${severity})`, { metadata: incident });

    return incident;
  }

  createIncidentFromAlert(alert) {
    const existing = Array.from(this.incidents.values()).find(
      i => i.alertId === alert.id && i.state !== IncidentStates.CLOSED && i.state !== IncidentStates.RESOLVED
    );
    if (existing) return existing;

    return this.createIncident(
      `Incident: ${alert.title}`,
      alert.severity,
      alert.message,
      alert.id
    );
  }

  transitionIncident(id, nextState, reason = '') {
    const incident = this.incidents.get(id);
    if (!incident) throw new Error(`Incident not found: ${id}`);

    const oldState = incident.state;
    const fsm = new IncidentStateMachine(oldState);
    fsm.transitionTo(nextState);

    incident.state = nextState;
    incident.updatedAt = Date.now();

    if (nextState === IncidentStates.RESOLVED) {
      incident.resolvedAt = Date.now();
      globalIncidentEvents.emitIncidentResolved(incident);
    }

    globalIncidentHistory.record(id, { from: oldState, to: nextState, reason });
    globalIncidentEvents.emitIncidentStateChanged(incident, oldState, nextState);

    globalLogManager.info('service', `[Incident State Change] ${incident.title} transitioned ${oldState} -> ${nextState}. Reason: ${reason}`, { metadata: incident });

    return incident;
  }

  getIncident(id) {
    return this.incidents.get(id);
  }

  getAllIncidents() {
    return Array.from(this.incidents.values());
  }

  clear() {
    this.incidents.clear();
  }
}

const globalIncidentManager = new IncidentManager();

module.exports = {
  IncidentManager,
  globalIncidentManager
};
