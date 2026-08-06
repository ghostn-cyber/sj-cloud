const { globalHealthCalculator } = require('./health-calculator');

class HealthScore {
  calculateScore() {
    return globalHealthCalculator.calculate();
  }

  getOverallScore() {
    const platform = this.calculateScore();
    return {
      timestamp: new Date().toISOString(),
      platform,
      tenant: Math.max(platform - 2, 0),
      application: Math.max(platform - 5, 0),
      deployment: Math.max(platform - 1, 0),
      pipeline: Math.max(platform - 3, 0)
    };
  }
}

const globalHealthScore = new HealthScore();

module.exports = {
  HealthScore,
  globalHealthScore
};
