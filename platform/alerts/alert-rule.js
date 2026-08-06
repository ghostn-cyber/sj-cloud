class AlertRule {
  constructor(id, name, checkFn, severity = 'WARNING') {
    this.id = id;
    this.name = name;
    this.checkFn = checkFn;
    this.severity = severity;
  }
}

module.exports = {
  AlertRule
};
