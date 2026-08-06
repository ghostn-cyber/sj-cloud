const fs = require('fs');
const path = require('path');

class LogStorage {
  constructor() {
    this.logDir = path.resolve(__dirname, '../../storage/logs');
    this.logFile = path.join(this.logDir, 'platform.log');
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  append(line) {
    this.ensureDirectory();
    fs.appendFileSync(this.logFile, line + '\n', 'utf8');
  }

  getFileSize() {
    if (!fs.existsSync(this.logFile)) return 0;
    return fs.statSync(this.logFile).size;
  }

  readAllLines() {
    if (!fs.existsSync(this.logFile)) return [];
    const content = fs.readFileSync(this.logFile, 'utf8');
    return content.split('\n').filter(line => line.trim() !== '');
  }

  rotate(backupPath) {
    if (fs.existsSync(this.logFile)) {
      fs.renameSync(this.logFile, backupPath);
      // Create fresh empty log file
      fs.writeFileSync(this.logFile, '', 'utf8');
    }
  }
}

const globalLogStorage = new LogStorage();

module.exports = {
  LogStorage,
  globalLogStorage
};
