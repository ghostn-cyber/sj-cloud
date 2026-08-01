class RuntimeContext {
  constructor(appId, image, ports, command) {
    this.application_id = appId;
    this.image = image;
    this.ports = Object.freeze([ ...(ports || []) ]);
    this.command = command;
    Object.freeze(this);
  }
}

module.exports = { RuntimeContext };
