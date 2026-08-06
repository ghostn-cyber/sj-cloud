class LogHistory {
  constructor(maxSize = 200) {
    this.buffer = [];
    this.maxSize = maxSize;
  }

  add(entry) {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getRecent() {
    return this.buffer;
  }

  clear() {
    this.buffer = [];
  }
}

const globalLogHistory = new LogHistory();

module.exports = {
  LogHistory,
  globalLogHistory
};
