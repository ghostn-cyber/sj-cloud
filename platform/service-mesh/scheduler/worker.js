class Worker {
  constructor() {
    this.intervals = [];
  }

  startJob(job) {
    console.log(`Scheduler Worker: Starting job [${job.name}] with interval ${job.intervalMs}ms`);
    // Run immediately
    job.execute().catch(() => {});
    
    const id = setInterval(() => {
      job.execute().catch(() => {});
    }, job.intervalMs);

    this.intervals.push({ name: job.name, id });
  }

  stopAll() {
    for (const item of this.intervals) {
      clearInterval(item.id);
    }
    this.intervals = [];
  }
}

module.exports = Worker;
