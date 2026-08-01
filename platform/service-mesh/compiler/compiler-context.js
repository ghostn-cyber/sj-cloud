class CompilerContext {
  constructor() {
    this.startTime = Date.now();
    this.configs = new Map();
    this.services = {};
    this.warnings = [];
    this.errors = [];
    this.dependencyGraph = {
      nodes: [],
      edges: []
    };
  }

  addConfig(id, config, filePath) {
    this.configs.set(id, { config, filePath });
  }

  addCompiledService(id, service) {
    this.services[id] = service;
    if (!this.dependencyGraph.nodes.includes(id)) {
      this.dependencyGraph.nodes.push(id);
    }
  }

  addWarning(message, component = 'compiler') {
    this.warnings.push({
      timestamp: new Date().toISOString(),
      message,
      component
    });
  }

  addError(error) {
    this.errors.push(error);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getDurationMs() {
    return Date.now() - this.startTime;
  }
}

module.exports = CompilerContext;
