const { IncidentStates } = require('./incident-state');

class IncidentValidator {
  validate(incident) {
    if (!incident) throw new Error('Incident cannot be empty');
    if (!incident.id) throw new Error('Incident must have an id');
    if (!incident.title) throw new Error('Incident must have a title');
    if (!incident.severity) throw new Error('Incident must have a severity');
    if (!Object.values(IncidentStates).includes(incident.state)) {
      throw new Error(`Invalid incident state: ${incident.state}`);
    }
    return true;
  }
}

const globalIncidentValidator = new IncidentValidator();

module.exports = {
  IncidentValidator,
  globalIncidentValidator
};
