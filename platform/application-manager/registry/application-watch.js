const fs = require('fs');
const path = require('path');

class ApplicationWatcher {
  constructor(tenantsDir, onCallback) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.onCallback = onCallback;
    this.watcher = null;
    this.debounceTimeout = null;
  }

  start() {
    if (!fs.existsSync(this.tenantsDir)) {
      return;
    }
    
    this.watcher = fs.watch(this.tenantsDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.includes('apps') && filename.endsWith('application.yaml')) {
        this.triggerCallback();
      }
    });
  }

  triggerCallback() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      if (typeof this.onCallback === 'function') {
        this.onCallback();
      }
    }, 200);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}

module.exports = {
  ApplicationWatcher
};
