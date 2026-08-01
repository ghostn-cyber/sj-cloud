const Job = require('./jobs');
const Worker = require('./worker');

class Scheduler {
  constructor() {
    this.worker = new Worker();
    this.jobs = {};
  }

  registerJob(name, intervalMs, fn) {
    const job = new Job(name, intervalMs, fn);
    this.jobs[name] = job;
    this.worker.startJob(job);
  }

  stop() {
    this.worker.stopAll();
  }
}

const globalScheduler = new Scheduler();

module.exports = {
  Scheduler,
  globalScheduler
};
