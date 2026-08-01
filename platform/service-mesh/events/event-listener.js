const { globalEventBus } = require('./event-bus');

class EventListener {
  constructor(bus = globalEventBus) {
    this.bus = bus;
    this.unsubscribers = [];
  }

  listen(type, callback) {
    const unsub = this.bus.subscribe(type, callback);
    this.unsubscribers.push(unsub);
    return unsub;
  }

  listenAll(callback) {
    return this.listen('*', callback);
  }

  cleanup() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
}

module.exports = {
  EventListener
};
