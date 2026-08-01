const fs = require('fs');
const SnapshotValidator = require('./snapshot-validator');

class SnapshotLoader {
  static load(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Snapshot file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    SnapshotValidator.validate(parsed);
    return parsed;
  }
}

module.exports = SnapshotLoader;
