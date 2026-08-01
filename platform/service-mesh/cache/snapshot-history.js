const fs = require('fs');
const path = require('path');

class SnapshotHistory {
  constructor(historyDir) {
    this.historyDir = historyDir;
    this.indexPath = path.join(historyDir, 'history-index.json');
  }

  ensureDir() {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
    if (!fs.existsSync(this.indexPath)) {
      fs.writeFileSync(this.indexPath, JSON.stringify([], null, 2), 'utf8');
    }
  }

  async addEntry(snapshot) {
    this.ensureDir();

    const buildNumber = snapshot.buildNumber || 1;
    const backupFile = `snapshot-${buildNumber}.json`;
    const backupPath = path.join(this.historyDir, backupFile);

    // Save snapshot backup
    fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), 'utf8');

    // Update index
    const indexContent = fs.readFileSync(this.indexPath, 'utf8');
    const index = JSON.parse(indexContent);

    // Prevent duplicate entries
    const existingIndex = index.findIndex(entry => entry.buildNumber === buildNumber);
    const newEntry = {
      buildNumber,
      version: snapshot.version || '1.0.0',
      compiledAt: snapshot.compiledAt,
      sha256: snapshot.sha256,
      file: backupFile
    };

    if (existingIndex !== -1) {
      index[existingIndex] = newEntry;
    } else {
      index.push(newEntry);
    }

    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8');
    return newEntry;
  }

  getEntries() {
    this.ensureDir();
    const indexContent = fs.readFileSync(this.indexPath, 'utf8');
    return JSON.parse(indexContent);
  }

  rollbackTo(buildNumber) {
    this.ensureDir();
    const entries = this.getEntries();
    const target = entries.find(entry => entry.buildNumber === buildNumber);
    if (!target) {
      throw new Error(`Rollback failed: build number ${buildNumber} not found in history`);
    }

    const backupPath = path.join(this.historyDir, target.file);
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Rollback failed: backup file ${target.file} does not exist`);
    }

    const snapshotContent = fs.readFileSync(backupPath, 'utf8');
    return JSON.parse(snapshotContent);
  }
}

module.exports = SnapshotHistory;
