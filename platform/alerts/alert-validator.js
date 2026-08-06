const VALID_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];

class AlertValidator {
  validate(alert) {
    if (!alert) throw new Error('Alert cannot be empty');
    if (!alert.id) throw new Error('Alert must have an id');
    if (!alert.ruleId) throw new Error('Alert must reference a ruleId');
    if (!alert.title) throw new Error('Alert must have a title');
    if (!VALID_SEVERITIES.includes(alert.severity)) {
      throw new Error(`Invalid alert severity: ${alert.severity}. Allowed: ${VALID_SEVERITIES.join(', ')}`);
    }
    return true;
  }
}

const globalAlertValidator = new AlertValidator();

module.exports = {
  AlertValidator,
  globalAlertValidator
};
