const { AllCapabilities } = require('./capability-registry');

class CapabilityManager {
  static getSupportedCapabilities() {
    return AllCapabilities;
  }

  static isCapabilitySupported(name) {
    return AllCapabilities.includes(name);
  }
}

module.exports = CapabilityManager;
