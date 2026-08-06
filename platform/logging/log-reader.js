const { globalLogStorage } = require('./log-storage');

class LogReader {
  readAll() {
    const lines = globalLogStorage.readAllLines();
    const entries = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch (err) {
        // Skip malformed log lines
      }
    }
    return entries;
  }
}

const globalLogReader = new LogReader();

module.exports = {
  LogReader,
  globalLogReader
};
