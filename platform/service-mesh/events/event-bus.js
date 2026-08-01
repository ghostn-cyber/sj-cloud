const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  publish(type, payload = {}) {
    const event = {
      type,
      payload,
      timestamp: Date.now(),
      id: `evt-${Math.random().toString(36).substr(2, 9)}`
    };
    this.emit(type, event);
    this.emit('*', event); // Wildcard listener support
    return event;
  }

  subscribe(type, callback) {
    this.on(type, callback);
    return () => this.off(type, callback);
  }
}

const globalEventBus = new EventBus();

module.exports = {
  EventBus,
  globalEventBus
};
