class Scheduler {
  constructor() {
    this.jobs = new Map();
  }

  schedule(name, intervalMs, fn) {
    this.unschedule(name);
    const timer = setInterval(() => {
      fn().catch(err => console.error(`Job ${name} failed:`, err.message));
    }, intervalMs);
    this.jobs.set(name, timer);
  }

  unschedule(name) {
    if (this.jobs.has(name)) {
      clearInterval(this.jobs.get(name));
      this.jobs.delete(name);
    }
  }

  stopAll() {
    for (const timer of this.jobs.values()) {
      clearInterval(timer);
    }
    this.jobs.clear();
  }
}

const globalScheduler = new Scheduler();
module.exports = { Scheduler, globalScheduler };
