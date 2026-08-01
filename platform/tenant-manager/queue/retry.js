class RetryPolicy {
  constructor(maxAttempts = 3, initialDelayMs = 1000) {
    this.maxAttempts = maxAttempts;
    this.initialDelayMs = initialDelayMs;
  }

  shouldRetry(task) {
    return task.attempts < this.maxAttempts;
  }

  getDelay(task) {
    // Exponential backoff
    return this.initialDelayMs * Math.pow(2, task.attempts - 1);
  }
}

module.exports = { RetryPolicy };
