class Compensation {
  constructor(steps) {
    this.steps = [...steps];
  }

  async execute(context) {
    // Run compensation in reverse order
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      try {
        console.log(`[Compensation] Rolling back step: ${step.name}`);
        await step.compensate(context);
      } catch (err) {
        console.error(`[Compensation] Rollback of step "${step.name}" failed: ${err.message}`);
      }
    }
  }
}

module.exports = { Compensation };
