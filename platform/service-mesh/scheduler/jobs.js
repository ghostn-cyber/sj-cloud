class Job {
  constructor(name, intervalMs, fn) {
    this.name = name;
    this.intervalMs = intervalMs;
    this.fn = fn;
    this.lastRun = 0;
  }

  async execute() {
    this.lastRun = Date.now();
    try {
      await this.fn();
    } catch (err) {
      console.error(`Scheduler Job [${this.name}] failed: ${err.message}`);
    }
  }
}

module.exports = Job;
