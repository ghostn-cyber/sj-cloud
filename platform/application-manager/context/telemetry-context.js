class TelemetryContext {
  constructor(metrics) {
    this.metrics = Object.freeze({ ...(metrics || {}) });
    Object.freeze(this);
  }
}

module.exports = { TelemetryContext };
