class EventLoopProfiler {
  constructor() {
    this.lagMs = 0;
    this.measure();
  }

  measure() {
    const start = Date.now();
    setImmediate(() => {
      this.lagMs = Date.now() - start;
      // Loop again
      setTimeout(() => this.measure(), 1000).unref();
    });
  }

  getLag() {
    return {
      lagMs: this.lagMs
    };
  }
}

const globalEventLoopProfiler = new EventLoopProfiler();

module.exports = {
  EventLoopProfiler,
  globalEventLoopProfiler
};
