const { execSync } = require('child_process');

class RuntimeMonitor {
  getStatus(containerName) {
    try {
      const inspect = execSync(`docker inspect --format='{{.State.Status}}' ${containerName}`, { stdio: 'pipe' }).toString().trim();
      return inspect.toUpperCase(); // 'RUNNING', 'EXITED', 'PAUSED', etc.
    } catch {
      return 'UNKNOWN';
    }
  }

  isContainerRunning(containerName) {
    const status = this.getStatus(containerName);
    return status === 'RUNNING';
  }
}

module.exports = { RuntimeMonitor };
