const fs = require('fs');
const path = require('path');

class RegistryWatcher {
  /**
   * @param {string} configDir Directory to watch
   * @param {Function} onchange Callback when a yaml file changes
   */
  constructor(configDir, onchange) {
    this.configDir = configDir;
    this.onchange = onchange;
    this.watcher = null;
    this.timeout = null;
  }

  start() {
    if (this.watcher) return;

    // Check if directory exists
    if (!fs.existsSync(this.configDir)) {
      throw new Error(`Directory to watch does not exist: ${this.configDir}`);
    }

    this.watcher = fs.watch(this.configDir, (eventType, filename) => {
      // Only watch yaml/yml files and ignore snapshot.json
      if (filename && (filename.endsWith('.yaml') || filename.endsWith('.yml')) && filename !== 'snapshot.json') {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          this.onchange(eventType, filename);
        }, 200);
      }
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = {
  RegistryWatcher
};
