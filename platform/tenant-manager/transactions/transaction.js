class Transaction {
  constructor() {
    this.steps = [];
  }

  addStep(step) {
    this.steps.push(step);
    return this;
  }

  getSteps() {
    return this.steps;
  }
}

module.exports = { Transaction };
