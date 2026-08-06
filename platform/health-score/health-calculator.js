const { globalHealthRules } = require('./health-rules');

class HealthCalculator {
  calculate() {
    const penalty = globalHealthRules.getPenalties();
    const score = 100 - penalty;
    return Math.max(0, Math.min(score, 100));
  }
}

const globalHealthCalculator = new HealthCalculator();

module.exports = {
  HealthCalculator,
  globalHealthCalculator
};
