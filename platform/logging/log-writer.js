const { globalLogStorage } = require('./log-storage');
const { globalLogHistory } = require('./log-history');

class LogWriter {
  write(entry) {
    const line = JSON.stringify(entry);
    globalLogStorage.append(line);
    globalLogHistory.add(entry);
  }
}

const globalLogWriter = new LogWriter();

module.exports = {
  LogWriter,
  globalLogWriter
};
