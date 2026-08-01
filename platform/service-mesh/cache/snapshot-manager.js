const path = require('path');
const fs = require('fs');
const SnapshotLoader = require('./snapshot-loader');
const SnapshotValidator = require('./snapshot-validator');
const SnapshotMetadata = require('./snapshot-metadata');
const SnapshotVersion = require('./snapshot-version');
const SnapshotHistory = require('./snapshot-history');
const { globalEventDispatcher } = require('../events');

class SnapshotManager {
  constructor(outputPath, historyDir) {
    this.outputPath = outputPath;
    this.historyDir = historyDir;
    this.history = new SnapshotHistory(historyDir);
  }

  commit(services, version = '1.0.0') {
    let prevBuildNumber = 0;
    if (fs.existsSync(this.outputPath)) {
      try {
        const prev = SnapshotLoader.load(this.outputPath);
        prevBuildNumber = prev.buildNumber || 0;
      } catch (_) {}
    }

    const nextBuildNumber = SnapshotVersion.incrementBuild(prevBuildNumber);
    const snapshot = SnapshotMetadata.generate(services, version, nextBuildNumber);
    SnapshotValidator.validate(snapshot);

    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.outputPath, JSON.stringify(snapshot, null, 2), 'utf8');
    this.history.addEntry(snapshot);

    return snapshot;
  }

  rollback(buildNumber) {
    let fromVersion = 'unknown';
    if (fs.existsSync(this.outputPath)) {
      try {
        const current = JSON.parse(fs.readFileSync(this.outputPath, 'utf8'));
        fromVersion = current.buildNumber || 'unknown';
      } catch (_) {}
    }

    const rolledBackSnapshot = this.history.rollbackTo(buildNumber);
    SnapshotValidator.validate(rolledBackSnapshot);

    fs.writeFileSync(this.outputPath, JSON.stringify(rolledBackSnapshot, null, 2), 'utf8');

    globalEventDispatcher.dispatchSnapshotRolledBack(fromVersion, buildNumber);

    return rolledBackSnapshot;
  }

  getHistory() {
    return this.history.getEntries();
  }
}

module.exports = SnapshotManager;
