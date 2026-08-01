class RuntimePlugin {
  constructor(name) {
    this.name = name;
  }

  async onLoad(context) {
    // Override in implementation
  }

  async preRoute(context, request, response) {
    // Hook called before request routing
  }

  async postRoute(context, request, response) {
    // Hook called after request routing
  }

  async onUnload() {
    // Override in implementation
  }
}

module.exports = RuntimePlugin;
